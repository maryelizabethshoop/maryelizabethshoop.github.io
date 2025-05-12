import pandas as pd

# Load your data
df = pd.read_csv('data/final_data.csv')

# Bin based on specified thresholds
bins = [0, 5000, 15000, float('inf')] #thresholds from https://www.collegedata.com/resources/the-facts-on-fit/college-size-small-medium-or-large
labels = ['Small', 'Medium', 'Large']
df['enrollment_bin'] = pd.cut(df['enrollment'], bins=bins, labels=labels, right=False)

# Check result
print(df[['enrollment', 'enrollment_bin']])

df.to_csv('final_data_bins.csv', index=False)

