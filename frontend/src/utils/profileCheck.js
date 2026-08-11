// frontend/src/utils/profileCheck.js

export function getMissingProfileFields(user) {
  if (!user) return [];
  const missing = [];

  if (!user.fullName || !user.fullName.trim()) missing.push('Full Name');
  if (!user.phone || !user.phone.trim()) missing.push('Phone Number');
  if (!user.city || !user.city.trim()) missing.push('City');
  if (!user.subRegion || !user.subRegion.trim()) missing.push('Specific Region / Division (e.g. Palayamkottai)');
  if (!user.addressText || !user.addressText.trim()) missing.push('Street Address');

  if (user.role === 'VOLUNTEER' && !user.isVerified) {
    missing.push('Identity Verification Badge');
  }

  if (user.role === 'SENIOR' && (!user.emergencyContactPhone || !user.emergencyContactPhone.trim())) {
    missing.push('Emergency Contact Number');
  }

  return missing;
}