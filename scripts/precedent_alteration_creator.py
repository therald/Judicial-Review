from pandas import read_csv, isna, notna
from pandas import DataFrame as df

citations = read_csv("../data/citations.csv").rename(columns={'usid': 'uscite'}).drop(columns=['oxford', 'liihc', 'hub', 'hubrank', 'auth', 'authrank', 'between', 'incent'])
cases = read_csv("../data/case_data.csv", encoding='latin1', converters = {"usCite": lambda x: x.replace(" ", "").replace(".", "")}).rename(columns={'usCite': 'uscite'})

all_data = cases[cases['precedentAlteration'] == 1].merge(citations[(citations['overruling'] != '0') & (citations['year'] >= 1946)], on='uscite', how='outer')
# all_data.to_csv('../data/temp_data.csv', index=False)
print(len(all_data))

intervals = []
for i, case1 in all_data.iterrows(): # go through all cases
    olen = len(intervals)
    if case1['uscite'] == '':
        intervals.append({'overruled_index': 'NaN', 'overruled_citation': 'NaN', 'overruling_index': 'NaN', 'overruling_citation': case1['uscite'], 'startdate': 'NaN', 'enddate': case1['dateDecision']})
    else:
        for overruling_i, overruling in cases[cases['uscite'] == case1['uscite']].iterrows(): # Get the case data for the overruling case
            if notna(case1['overruling']): # check for a case we already have a mapping for
                for j, case2 in citations[citations['uscite'] == case1['uscite']].iterrows(): # Go to the citation entry for the overruling case
                    for index in case2['overruling'].split(): # Get the citation index of each one
                        for k, case3 in citations[citations['caseid'] == int(index)].iterrows(): # Get the citation entry for the overruled case
                            for overruled_i, overruled in cases[cases['uscite'] == case3['uscite']].iterrows(): # Get the case entry for the overruled case
                                intervals.append({'overruled_index': overruled_i, 'overruled_citation': overruled['uscite'], 'overruling_index': overruling_i, 'overruling_citation': overruling['uscite'], 'startdate': overruled['dateDecision'], 'enddate': overruling['dateDecision']})
            else: # Ok no known mapping yet
                intervals.append({'overruled_index': 'NaN', 'overruled_citation': 'NaN', 'overruling_index': overruling_i, 'overruling_citation': overruling['uscite'], 'startdate': 'NaN', 'enddate': overruling['dateDecision']})
print(len(intervals))
# intervals = []
# for i, overruling in all_data.iterrows():
#     if overruling['precedentAlteration'] != 0 and (isna(overruling['overruling']) or overruling['overruling'] == 0):
#         intervals.append({'overruled': 'NaN', 'overruling': i, 'startdate': 'NaN', 'enddate': overruling['dateDecision'], 'importance': 'NaN'})
#     elif not isna(overruling['overruling']):
#         for index in overruling['overruling'].split():
#             for j, overruled in citations[citations['caseid'] == int(index)].iterrows():
#                 if len(cases[cases['uscite'] == overruled['uscite']]) != 0:
#                     for _, overruled_date in cases[cases['uscite'] == overruled['uscite']].iterrows():
#                         startdate = overruled_date['dateDecision']
#                         intervals.append({'overruled': j, 'overruling': i, 'startdate': startdate, 'enddate': overruling['dateDecision'], 'importance': overruled['indeg']})
#                 else:
#                     intervals.append({'overruled': j, 'overruling': i, 'startdate': 'NaN', 'enddate': overruling['dateDecision'], 'importance': overruled['indeg']})
df.from_dict(intervals).to_csv('../data/precedent_pairs.csv', index=False)