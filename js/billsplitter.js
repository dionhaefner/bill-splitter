// Frontend
$(document).ready(function() {
   show_page_one();
   $('select').material_select();
   $('ul.tabs').tabs();
 });

var groups = {};
var groupnum = 1;
var names;

 function show_page_one() {
   $("#page-1").show();
   $("#page-2").hide();
   $("#page-results").hide();
 }

 function fill_namelists() {
   $('ul#namelist').empty();
   $.each(groups, function(n) {
     fill_namelist("grouptab" + n);
   });
 }

 function fill_namelist(groupname) {
   $.each(names, function(i, name){
     $('#' + groupname + ' ul#namelist').append(
       '<li id="' + i + '" class="collection-item"><div class="check-button waves-effect z-depth-1 left"><label><input type="checkbox" value="1"><span>' + name + '</span></label></div><div class="input-field right"><input type="number" step="0.01" min="0" value="0" class="validate" disabled></div><div class="clearfix"></div></li>'
     );
     $("#" + groupname + " #" + i + " input:checkbox").click(function() {
       $("#" + groupname + " #" + i + " input[type='number']").attr("disabled", !this.checked);
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
  var n = groupnum;
  $("ul#grouplist").append(
    '<li id="group' + n + '" class="tab"><a href="#grouptab' + n + '">Group ' + n + '</a></li>'
  );
  $("div#grouptabs").append(
    '<div id="grouptab' + n + '" class="col s12"><ul id="namelist" class="collection"></ul><a class="waves-effect waves-light btn red" onclick="remove_group(' + n + ')"><i class="material-icons left">delete</i> Delete Group</a></div>'
  );
  fill_namelist('grouptab' + n);
  $('ul.tabs').children().removeAttr('style');
  $('ul.tabs').tabs().tabs('select_tab', 'grouptab' + n);
  groups[n] = {};
  groupnum += 1;
}

function remove_group(n) {
  $('#grouptab' + n).remove();
  $('#group' + n).remove();
  $('ul.tabs').tabs();
  delete groups[n];
  if (Object.keys(groups).length) {
    $('ul.tabs').tabs('select_tab', 'grouptab' + Object.keys(groups)[0]);
  }
}

function submit_page_two() {
  console.log(Object.keys(groups));
  if (!Object.keys(groups).length) {
      Materialize.toast("You need to create at least one group", 4000, "toast-error");
      return false;
  }
  var fatal_error = false;
  $.each(groups, function(groupnum, groupamount) {
    $.each(names, function(j, name) {
      var num_input = $("#grouptab" + groupnum + " #namelist #" + j + " input[type='number']");
      if (num_input.prop("disabled")) {
        return;
      }
      var num_input_float = parseFloat(num_input.val());
      if (!num_input_float) {
        Materialize.toast("Only numerical values allowed", 4000, "toast-error");
        fatal_error = true;
        return false;
      }
      groupamount[name] = num_input_float;
    });
    if (fatal_error) {
      return false;
    }
  });
  if (fatal_error) {
    return false;
  }

  var transactions = calc_transactions(groups);
  $("#page-results table#transactions tbody").empty();
  $.each(transactions, function(sender, receivers) {
    console.log(sender);
    console.log(receivers);
    $.each(receivers, function(receiver, amount) {
      $("#page-results table#transactions tbody").append(
        "<tr> <td>" + sender + "</td> <td>" + receiver + "</td> <td>" + amount + "</td> </tr>"
      );
    });
  });
  show_results();
}

function show_results() {
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

function calc_transactions(groups) {
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
