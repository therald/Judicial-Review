from pandas import read_csv, isna
from pandas import DataFrame as df

citations = read_csv("../data/citations.csv").rename(columns={'usid': 'uscite'}).drop(columns=['parties', 'year', 'oxford', 'liihc', 'hub', 'hubrank', 'auth', 'authrank', 'between', 'incent'])
cases = read_csv("../data/case_data.csv", encoding='latin1', converters = {"usCite": lambda x: x.replace(" ", "").replace(".", "")}).rename(columns={'usCite': 'uscite'})

all_data = cases.merge(citations, on='uscite', how='outer')

intervals = []
for i, overruling in all_data.iterrows():
    if overruling['precedentAlteration'] != 0 and (isna(overruling['overruling']) or overruling['overruling'] == 0):
        intervals.append({'overruled': 'NaN', 'overruling': i, 'startdate': 'NaN', 'enddate': overruling['dateDecision'], 'importance': 'NaN'})
    elif not isna(overruling['overruling']):
        for index in overruling['overruling'].split():
            for j, overruled in all_data[all_data['caseid'] == int(index)].iterrows():
                intervals.append({'overruled': j, 'overruling': i, 'startdate': overruled['dateDecision'], 'enddate': overruling['dateDecision'], 'importance': overruled['indeg']})
df.from_dict(intervals).to_csv('../data/precedent_pairs.csv', index=False)