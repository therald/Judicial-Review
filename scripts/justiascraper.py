import pandas as pd
from bs4 import BeautifulSoup

citations = pd.read_csv('../data/case_data.csv', encoding='latin1').usCite
citations = citations[citations.notna()]

