import pandas as pd

# Load the two CSV files
salary = pd.read_csv('salary_potential.csv')
tuition = pd.read_csv('tuition_cost.csv')
enrollment = pd.read_csv('College_Enroll_2020.csv')

# Rename the relevant columns to a common name, say "School Name"
salary.rename(columns={'state_name': 'state'}, inplace=True)
enrollment.rename(columns={'institution_name': 'name'}, inplace=True)
enrollment.rename(columns={'12_Month_Enrollment': 'enrollment'}, inplace=True)

# Select only the desired columns before merging
salary = salary[['name', 'early_career_pay']]
tuition = tuition[['name', 'state', 'type', 'in_state_total', 'out_of_state_total']]


# Merge the dataframes on 'School Name'
merged_df = pd.merge(tuition, salary, on='name', how='inner')  # use 'outer', 'left', or 'right' if needed

final_df = pd.merge(merged_df, enrollment, on='name', how='inner')
# Now merged_df contains the joined data
final_df.to_csv('final_data.csv', index=False)
