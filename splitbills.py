
# coding: utf-8

# # Unsere Fickkosten

# In[98]:


import copy


class defaultdict(dict):
    def __init__(self, obj, factory):
        self.factory = factory
        super(defaultdict, self).__init__(obj)
        
    def __getitem__(self, key):
        if key not in self.keys():
            return self.factory()
        return super(defaultdict, self).__getitem__(key)
        
        
class Costgroup(object):
    def __init__(self, costs):
        self.costs = self.subtract_mean(costs)
       
    @staticmethod
    def mean(d):
        return sum(d.values()) / len(d)

    @staticmethod
    def subtract_mean(d):
        m = Costgroup.mean(d)
        return defaultdict({k: v - m for k, v in d.items()}, float)
    
    def __add__(self, other):
        if not isinstance(other, Costgroup):
            other = defaultdict(other, float)
        self.costs = defaultdict({k: self.costs[k] + other.costs[k] for k in set(self.costs.keys() + other.costs.keys())}, float)
        return self
    
    def keys(self):
        return self.costs.keys()
    
    def values(self):
        return self.costs.values()
    
    def items(self):
        return zip(self.keys(), self.values())
    
    @staticmethod
    def round_to_cents(val):
        return round(val * 100) / 100.
    
    def calc_transactions(self):
        senders, receivers = {}, {}
        for k, v in self.costs.items():
            v = self.round_to_cents(v)
            if v < 0:
                senders[k] = -v
            else:
                receivers[k] = v
        balance = copy.copy(receivers)
        transactions = {}
        for s, v in senders.items():
            budget = v
            transactions[s] = {}
            for r in balance.keys():
                if budget == 0.:
                    break
                transaction = min(budget, balance[r])
                transactions[s][r] = transaction
                budget -= transaction
                balance[r] -= transaction
                if not balance[r]:
                    del balance[r]
        assert all(self.round_to_cents(sum(transactions[k].values())) == senders[k] for k in senders.keys())
        assert all(sum(defaultdict(trans_receivers, float)[k] for trans_receivers in transactions.values()) == receivers[k] for k in receivers.keys())
        return transactions
    
def print_transactions(transactions):
    maxwidth1 = max(map(len, transactions.keys()))
    maxwidth2 = max(max(map(len, v.keys())) for v in transactions.values())
    maxwidth3 = max(max(map(lambda x: len(str(x)), v.values())) for v in transactions.values())
    format_string = "{{:<{}}} -> {{:<{}}}: {{:>{}}}".format(maxwidth1 + 1, maxwidth2 + 1, maxwidth3 + 1)
    for sender, receivers in transactions.items():
        for receiver, value in receivers.items():
            print(format_string.format(sender, receiver, value))


# In[99]:


main_group = Costgroup({
    "moritz": 334.25,
    "dion": 0,
    "tim": 17.74 + 197.74 + 187.36 + 8.30 + 96.95,
    "yannik": 80,
    "max": 0,
    "peter": 0,
    "paul": 40,
    "uli": 0
})

subgrp1 = Costgroup({
    "moritz": 345.39 + 259.04,
    "dion": 0,
    "tim": 0,
    "yannik": 0,
    "max": 0,
    "peter": 0,
    "paul": 0,
})

subgrp2 = Costgroup({
    "moritz": 389.95,
    "dion": 0,
    "yannik": 0,
    "peter": 0,
    "paul": 0,
})

subgrp3 = Costgroup({
    "uli": 0,
    "moritz": 48.74 * 2
})

all_costs = main_group + subgrp1 + subgrp2 + subgrp3
print_transactions(all_costs.calc_transactions())


# In[ ]:




