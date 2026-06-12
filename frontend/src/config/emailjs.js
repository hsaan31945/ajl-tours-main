// EmailJS Configuration
// Replace these values with your actual EmailJS credentials

export const EMAILJS_CONFIG = {
  // Your EmailJS Service ID
  SERVICE_ID: 'service_3t1r2ix',
  
  // Your EmailJS Template ID for password reset
  TEMPLATE_ID: 'template_iewa53m',
  
  // Your EmailJS Public Key
  PUBLIC_KEY: 'faT-uwzxGF1JZEBjo',
};

// Email template variables that will be replaced in your EmailJS template
export const EMAIL_TEMPLATE_VARIABLES = {
  to_email: '{{to_email}}', // Recipient email
  passcode: '{{passcode}}', // 6-digit OTP code
  time: '{{time}}', // Expiry time
  company_name: '{{company_name}}', // Company name (AJL Tours)
};

// Email template content (for reference)
export const EMAIL_TEMPLATE_CONTENT = `
Use the 6-digit code below to reset your password. It expires in 10 minutes.

{{passcode}}

This OTP will be valid for 15 minutes till {{time}}.

Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.
{{company_name}} will never contact you about this email or ask for any login codes or links. Beware of phishing scams.

Thanks for visiting {{company_name}}!
`;

export default EMAILJS_CONFIG;