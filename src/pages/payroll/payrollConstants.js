
export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const DEPARTMENTS = ['All','IT','HR','Finance','Operations','Sales','Marketing','Admin'];
export const PAYROLL_STATUSES = ['All','Pending','Processed','Approved','Paid','Hold'];
export const DESIGNATIONS = ['All','Manager','Executive','Officer','Assistant','Trainee','Consultant','Engineer','Analyst'];

export const roundVal = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? val : Math.round(num);
};

export const fmt = (val) => {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = Number(val);
  if (isNaN(num)) return val;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

export const fmtNum = (val) => {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return val;
  return Math.round(num).toLocaleString('en-IN');
};

