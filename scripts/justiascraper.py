import requests
import pandas as pd
import logging
import progressbar as pgb
import subprocess as sp
from bs4 import BeautifulSoup
from queue import Queue
from threading import Thread, Lock
from pprint import pprint

precedent_pairs = pd.read_csv('../data/precedent_pairs.csv').overruling_citation

grouped_citations = precedent_pairs.str.extract(r'(?P<volume>\d+)\s*(?P<reporter>U\.*S\.*)\s*(?P<page>\d+)')
grouped_citations.reporter = grouped_citations.reporter.str.replace('.', '', regex=False).str.lower()

WORKER_THREADS = 40
BASE_SITE = 'https://supreme.justia.com/cases/federal/'

# Set up the progress bar
bar = pgb.ProgressBar(max_value=len(grouped_citations))
pgb.streams.wrap_stderr()
logging.basicConfig()

# Thread queue for multiprocessed cloning
q = Queue()
lock = Lock()

bad_cases = []
results = {}

# Get Justia page process called by worker thread
def getPage(volume, reporter, page):
    page = '{}/{}/{}/{}/'.format(BASE_SITE, reporter, volume, page)
    res = requests.get(page)
    res.raise_for_status()
    return res.text

def captureSummary(pageHtml, volume, reporter, page):
    soup = BeautifulSoup(pageHtml, 'html.parser')
    text = soup.find(id='diminished-text')
    if text is not None:
        results["{}{}{}".format(volume, reporter, page)] = text
        return True
    return False
    
# Worker thread - retrieve from Queue and process data for capture
def worker():
    while True:
        case_data = q.get()
        try:
            pageHtml = getPage(*case_data)
            success = captureSummary(pageHtml, *case_data)

            # Use a lock to cleanly print output and errors and update the progress bar
            with lock:
                bar.update(len(grouped_citations) - q.qsize())
        except:
            with lock:
                bad_cases.append(case_data)
        finally:
            q.task_done()

# Create Worker Threads
for i in range(WORKER_THREADS):
    t = Thread(target=worker)
    t.daemon = True
    t.start()

# Populate queue with repo data for cloning
for index, row in grouped_citations.iterrows():
    q.put([row[0], row[1], row[2]])

# block until all tasks are done
q.join()

def getInterestingData(section):
    res = {}
    primary_holding = section.find(text="Primary Holding")
    res['primary_holding'] = primary_holding.find_next().string if primary_holding is not None else None
    res['primary_holding'] = res['primary_holding'].strip() if res['primary_holding'] is not None else res['primary_holding']
    case_commentary = section.find(text="Case Commentary")
    res['case_commentary'] = case_commentary.find_next().string if case_commentary is not None else None
    res['case_commentary'] = res['case_commentary'].strip() if res['case_commentary'] is not None else res['case_commentary']
    return res

info = {}
for key, value in results.items():
    info[key] = getInterestingData(value)
print(info)