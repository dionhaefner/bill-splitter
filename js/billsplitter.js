// Frontend
$(document).ready(function() {
   $('select').material_select();
   $('ul.tabs').tabs();
   Materialize.updateTextFields();
 });

var groups = [];
var groupnum = 1;
var names;

 function show_page_one() {
   Materialize.updateTextFields();
   $("#page-1").show();
   $("#page-2").hide();
   $("#page-results").hide();
 }

 function fill_namelists() {
   $('ul#namelist').empty();
   $.each(groups, function(i, groupname) {
     fill_namelist(groupname);
   });
 }

 function fill_namelist(groupname) {
   $.each(names, function(i, name){
     $('#' + groupname + ' ul#namelist').append(
       '<li id="' + name + '" class="collection-item"><div class="input-field inline right"><input type="number" step="0.01" min="0" value="0" class="validate" disabled></div><div class="check-button waves-effect z-depth-1 left"><label><input type="checkbox" value="1"><span>' + name + '</span></label></div><div class="clearfix"></div></li>'
     );
     $("#" + groupname + " #" + name + " input:checkbox").click(function() {
       $("#" + groupname + " #" + name + " input[type='number']").attr("disabled", !this.checked);
     });
    });
 }

 function submit_page_one() {
   var input_names = $("#names").val().split(/\r?\n/);
   input_names = input_names.filter(function(str) {
    return /\S/.test(str);
   });
   if (input_names.length == 0) {
     Materialize.toast("Please enter at least one name", 4000, "toast-error");
     return false;
   }
   if (input_names.length != new Set(input_names).size) {
     Materialize.toast("Name list may not contain duplicates", 4000, "toast-error");
     return false;
   }
   names = input_names;
   fill_namelists();
   show_page_two();
 }

function show_page_two() {
  $("#page-1").hide();
  $("#page-2").show();
  $("#page-results").hide();
}

function add_group() {
  var n = $("ul#grouplist li").length - 1;
  $("ul#grouplist").append(
    '<li class="tab col s3"><a href="#group' + n + '">Group ' + n + '</a></li>'
  );
  $("div#grouptabs").append(
    '<div id="group' + n + '" class="col s12"><ul id="namelist" class="collection"></ul><a class="waves-effect waves-light btn-floating" onclick="remove_group(' + n + ')"><i class="material-icons">remove</i></a></div>'
  );
  fill_namelist('group' + n);
  $('ul.tabs').children().removeAttr('style');
  $('ul.tabs').tabs().tabs('select_tab', 'group' + n);
  groups.push({});
}

function remove_group(n) {
  $('#group' + n).remove();
  $('ul.tabs').tabs();
  groups.splice(n, 1);
}

function show_results() {
  if (!groups.length) {
      Materialize.toast("You need to create at least one group", 4000, "toast-error");
      return false;
  }
  $.each(groups, function(groupnum, groupamount) {
    $.each(names, function(j, name) {
      var num_input = $("#group" + groupnum + " #namelist #" + name + " input[type='number']");
      if (num_input.prop("disabled")) {
        return;
      }
      groupamount[name] = parseFloat(num_input.val());
    });
    console.log(groups[groupnum]);
  });
  var transactions = calc_transactions();
  $.each(transactions, function(sender, receivers) {
    console.log(sender);
    console.log(receivers);
    $.each(receivers, function(receiver, amount) {
      $("#page-results table#transactions tbody").append(
        "<tr> <td>" + sender + "</td> <td>" + receiver + "</td> <td>" + amount + "</td> </tr>"
      );
    });
  });
  $("#page-1").hide();
  $("#page-2").hide();
  $("#page-results").show();
}

// Backend
function round_to_cents(val) {
  return Math.round(100 * val) / 100;
}

function subtract_mean(group) {
  var mean = 0
  var length = 0
  $.each(group, function(j, val) {
    mean += val;
    length += 1;
  });
  mean = mean / length;
  var diff = {};
  $.each(group, function(j, val) {
    diff[j] = val - mean;
  });
  return diff;
}

function calc_transactions() {
  var diff = []
  $.each(groups, function(i, group) {
    diff.push(subtract_mean(group));
  });

  var total_group = {};
  $.each(names, function(i, name){
    total_group[name] = 0.;
  });
  $.each(diff, function(i, group) {
    $.each(group, function(name, val) {
      total_group[name] += val;
    });
  });

  var senders = {};
  var receivers = {};
  $.each(total_group, function(name, val) {
    if (val < 0) {
      senders[name] = -val;
    }
    else {
      receivers[name] = val;
    }
  });

  var transactions = {}
  $.each(senders, function(sender, budget) {
    transactions[sender] = {};
    $.each(receivers, function(receiver, balance){
      if (budget <= 0) {
        return false;
      }
      if (balance <= 0) {
        return;
      }
      var transaction = round_to_cents(Math.min(budget, balance));
      transactions[sender][receiver] = transaction;
      receivers[receiver] -= transaction;
      budget -= transaction;
    });
  });
  return transactions;
}
