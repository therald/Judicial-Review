from pandas import read_csv
from pandas import DataFrame as df

citations = read_csv("../data/citations.csv").rename(columns={'usid': 'uscite'}).drop(columns=['parties', 'year', 'oxford', 'liihc', 'hub', 'hubrank', 'auth', 'authrank', 'between', 'incent'])
cases = read_csv("../data/case_data.csv", encoding='latin1', converters = {"usCite": lambda x: x.replace(" ", "").replace(".", "")}).rename(columns={'usCite': 'uscite'})

all_data = cases.merge(citations, on='uscite', how='inner')

intervals = []
for i, overruling in all_data[all_data['overruling'].str.strip() != '0'].iterrows():
    for index in overruling['overruling'].split():
        inter = {}
        for j, overruled in all_data[all_data['caseid'] == int(index)].iterrows():
            intervals.append({'overruled': j, 'overruling': i, 'startdate': overruled['dateDecision'], 'enddate': overruling['dateDecision'], 'importance': overruled['indeg']})
df.from_dict(intervals).to_csv('../data/precedent_pairs.csv', index=False)