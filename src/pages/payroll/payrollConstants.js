
export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const DEPARTMENTS = ['All','IT','HR','Finance','Operations','Sales','Marketing','Admin'];
export const PAYROLL_STATUSES = ['All','Pending','Processed','Approved','Paid','Hold'];
export const DESIGNATIONS = ['All','Manager','Executive','Officer','Assistant','Trainee','Consultant','Engineer','Analyst'];

export const fmt = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtNum = (val) =>
  Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

