/**
 * Local Mock API - Uses JSON files instead of MongoDB
 * Use this when MongoDB Atlas connection is not available
 */

// Mock Data (same as in mockData JSON files)
const mockCities = [
  { name: 'Kota', state: 'Rajasthan', colleges: ['Allen', 'FIITJEE', 'Bansal', 'Resonance'], population: 1200000 },
  { name: 'Sikar', state: 'Rajasthan', colleges: ['Sikar Coaching Hub', 'Sikar Study Center'], population: 350000 },
  { name: 'Indore', state: 'Madhya Pradesh', colleges: ['IIT-Indore', 'MITS', 'NRI'], population: 2100000 },
];

const mockAreas = [
  { city: 'Kota', name: 'Dadabari', zone: 'North', landmarks: ['Railway Station'] },
  { city: 'Kota', name: 'Nayapura', zone: 'Central', landmarks: ['Hospital'] },
  { city: 'Sikar', name: 'Piprali Road', zone: 'North', landmarks: ['Market'] },
  { city: 'Sikar', name: 'Subhash Chowk', zone: 'Central', landmarks: ['Bus Stand'] },
  { city: 'Indore', name: 'Rajwada', zone: 'Central', landmarks: ['Palace'] },
  { city: 'Indore', name: 'Khajrana', zone: 'North', landmarks: ['Temple'] },
];

const mockProperties = [
  {
    _id: 'KOTA-001',
    visitId: 'KOTA-001',
    property_name: 'Cozy PG North',
    propertyName: 'Cozy PG North',
    property_type: 'PG',
    propertyType: 'PG',
    city: 'Kota',
    area: 'Dadabari',
    rent: 8000,
    monthlyRent: 8000,
    owner_name: 'Rajesh Singh',
    ownerName: 'Rajesh Singh',
    owner_phone: '9876543210',
    contactPhone: '9876543210',
    gender: 'Co-ed',
    genderSuitability: 'Co-ed',
    beds: 15,
    status: 'approved',
    isVerified: true,
    isLiveOnWebsite: true,
    nearbyColleges: ['Allen', 'FIITJEE', 'Bansal'],
    generatedCredentials: { loginId: 'kota_pg_001', ownerName: 'Rajesh Singh' },
    image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600',
    professionalPhotos: [
      'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600'
    ]
  },
  {
    _id: 'KOTA-002',
    visitId: 'KOTA-002',
    property_name: 'Student Hostel Central',
    propertyName: 'Student Hostel Central',
    property_type: 'Hostel',
    propertyType: 'Hostel',
    city: 'Kota',
    area: 'Nayapura',
    rent: 6500,
    monthlyRent: 6500,
    owner_name: 'Priya Sharma',
    ownerName: 'Priya Sharma',
    owner_phone: '9765432109',
    contactPhone: '9765432109',
    gender: 'Male',
    genderSuitability: 'Male',
    beds: 30,
    status: 'approved',
    isVerified: true,
    isLiveOnWebsite: true,
    nearbyColleges: ['Resonance', 'FIITJEE', 'Allen'],
    generatedCredentials: { loginId: 'kota_hostel_001', ownerName: 'Priya Sharma' },
    image: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600',
    professionalPhotos: [
      'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/279719/pexels-photo-279719.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=600'
    ]
  },
  {
    _id: 'INDORE-001',
    visitId: 'INDORE-001',
    property_name: 'Modern PG Indore',
    propertyName: 'Modern PG Indore',
    property_type: 'PG',
    propertyType: 'PG',
    city: 'Indore',
    area: 'Rajwada',
    rent: 7000,
    monthlyRent: 7000,
    owner_name: 'Anjali Patel',
    ownerName: 'Anjali Patel',
    owner_phone: '9654321098',
    contactPhone: '9654321098',
    gender: 'Female',
    genderSuitability: 'Female',
    beds: 20,
    status: 'approved',
    isVerified: true,
    isLiveOnWebsite: true,
    nearbyColleges: ['IIT-Indore', 'MITS', 'Devi Ahilya'],
    generatedCredentials: { loginId: 'indore_pg_001', ownerName: 'Anjali Patel' },
    image: 'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600',
    professionalPhotos: [
      'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/271647/pexels-photo-271647.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600'
    ]
  },
  {
    _id: 'SIKAR-001',
    visitId: 'SIKAR-001',
    property_name: 'Sikar Coaching PG',
    propertyName: 'Sikar Coaching PG',
    property_type: 'PG',
    propertyType: 'PG',
    city: 'Sikar',
    area: 'Piprali Road',
    rent: 9000,
    monthlyRent: 9000,
    owner_name: 'Neha Singh',
    ownerName: 'Neha Singh',
    owner_phone: '9543210987',
    contactPhone: '9543210987',
    gender: 'Female',
    genderSuitability: 'Female',
    beds: 18,
    status: 'approved',
    isVerified: true,
    isLiveOnWebsite: true,
    nearbyColleges: ['Sikar Coaching Hub', 'Sikar Study Center'],
    generatedCredentials: { loginId: 'sikar_pg_001', ownerName: 'Neha Singh' },
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
    professionalPhotos: [
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600'
    ]
  },
  {
    _id: 'KOTA-002',
    visitId: 'KOTA-002',
    property_name: 'Kota Student Hostel',
    propertyName: 'Kota Student Hostel',
    property_type: 'Hostel',
    propertyType: 'Hostel',
    city: 'Kota',
    area: 'Vigyan Nagar',
    rent: 10000,
    monthlyRent: 10000,
    owner_name: 'Priya Gupta',
    ownerName: 'Priya Gupta',
    owner_phone: '9432109876',
    contactPhone: '9432109876',
    gender: 'Female',
    genderSuitability: 'Female',
    beds: 12,
    status: 'approved',
    isVerified: true,
    isLiveOnWebsite: true,
    nearbyColleges: ['Delhi University', 'NSIT', 'IIT-Delhi'],
    generatedCredentials: { loginId: 'delhi_pg_001', ownerName: 'Priya Gupta' },
    image: 'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600',
    professionalPhotos: [
      'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2082087/pexels-photo-2082087.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=600'
    ]
  }
];

// Mock API functions
export const fetchCitiesLocal = async () => {
  return mockCities;
};

export const fetchAreasLocal = async () => {
  return mockAreas;
};

export const fetchPropertiesLocal = async () => {
  return mockProperties;
};

// Get nearby areas for a city
export const getNearbyAreas = async (cityName) => {
  return mockAreas.filter(a => a.city === cityName);
};

// Get colleges for a city
export const getCollegesForCity = async (cityName) => {
  const city = mockCities.find(c => c.name === cityName);
  return city ? city.colleges : [];
};

// Get properties by city
export const getPropertiesByCity = async (cityName) => {
  return mockProperties.filter(p => p.city === cityName);
};

// Get properties by area
export const getPropertiesByArea = async (cityName, areaName) => {
  return mockProperties.filter(p => p.city === cityName && p.area === areaName);
};

// Get properties by type
export const getPropertiesByType = async (propertyType) => {
  return mockProperties.filter(p => p.propertyType === propertyType);
};

// Get all available property types
export const getPropertyTypes = async () => {
  const types = [...new Set(mockProperties.map(p => p.propertyType))];
  return types.map(t => ({ name: t, value: t }));
};

export default {
  fetchCitiesLocal,
  fetchAreasLocal,
  fetchPropertiesLocal,
  getNearbyAreas,
  getCollegesForCity,
  getPropertiesByCity,
  getPropertiesByArea,
  getPropertiesByType,
  getPropertyTypes
};
