const getPasswordPolicyErrors = (password) => {
  const value = String(password || '');
  const errors = [];

  if (value.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(value)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(value)) errors.push('one lowercase letter');
  if (!/\d/.test(value)) errors.push('one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.push('one special character');

  return errors;
};

const getPasswordPolicyMessage = (password) => {
  const errors = getPasswordPolicyErrors(password);
  if (errors.length === 0) return '';
  return `Password must include ${errors.join(', ')}.`;
};

module.exports = {
  getPasswordPolicyErrors,
  getPasswordPolicyMessage
};
