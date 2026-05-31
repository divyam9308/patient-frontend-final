// database/doctorsData.js
// Static data: Cities → Hospitals → Departments → Doctors
// Used by the smart appointment booking system to drive the multi-step form
// and to calculate slot availability.

export const DEFAULT_SLOTS = [
  "09:00",
  "10:30",
  "12:00",
  "14:00",
  "15:30",
  "17:00",
];

// Hierarchy: city → hospitals → departments → doctors
export const CITIES_DATA = {
  Mumbai: {
    hospitals: {
      "Kokilaben Dhirubhai Ambani Hospital": {
        departments: {
          Cardiology: ["Dr. Ramesh Mehta", "Dr. Sunita Joshi"],
          Neurology: ["Dr. Arvind Kapoor"],
          Orthopedics: ["Dr. Priya Malhotra", "Dr. Vikash Sharma"],
          Pediatrics: ["Dr. Neha Rajan"],
          Oncology: ["Dr. Shalini Desai"],
          Dermatology: ["Dr. Aakash Patel"],
          General: ["Dr. Rohit Kumar", "Dr. Ananya Singh"],
        },
      },
      "Lilavati Hospital": {
        departments: {
          Cardiology: ["Dr. Deepa Nair"],
          Neurology: ["Dr. Manish Gupta", "Dr. Snehal Bose"],
          Gynecology: ["Dr. Pooja Iyer"],
          Orthopedics: ["Dr. Kiran Joshi"],
          ENT: ["Dr. Suresh Reddy"],
          General: ["Dr. Payal Shah"],
        },
      },
      "Hinduja Hospital": {
        departments: {
          Cardiology: ["Dr. Rajiv Nair", "Dr. Vinita Sharma"],
          Urology: ["Dr. Ashok Tiwari"],
          Gastroenterology: ["Dr. Meena Rao"],
          Nephrology: ["Dr. Tarun Bose"],
          General: ["Dr. Sanjay Patil"],
        },
      },
    },
  },
  Delhi: {
    hospitals: {
      "All India Institute of Medical Sciences (AIIMS)": {
        departments: {
          Cardiology: ["Dr. Anil Verma", "Dr. Sunita Bhatia"],
          Neurology: ["Dr. Ravi Saxena", "Dr. Kavita Arora"],
          Oncology: ["Dr. Prabhat Singh"],
          Orthopedics: ["Dr. Neelam Chawla"],
          Pediatrics: ["Dr. Deepak Sharma", "Dr. Anu Batra"],
          Dermatology: ["Dr. Rakesh Jain"],
          General: ["Dr. Monika Rawat"],
        },
      },
      "Fortis Escorts Heart Institute": {
        departments: {
          Cardiology: ["Dr. S. K. Choudhary", "Dr. Meenal Saxena"],
          Radiology: ["Dr. Sanjay Chopra"],
          General: ["Dr. Divya Kapoor"],
        },
      },
      "Medanta – The Medicity": {
        departments: {
          Cardiology: ["Dr. Naresh Trehan"],
          Neurology: ["Dr. Sudhir Tyagi"],
          Orthopedics: ["Dr. Hiranmay Saha"],
          Gastroenterology: ["Dr. T. K. Chattopadhyay"],
          Nephrology: ["Dr. Prasun Ghosh"],
          Oncology: ["Dr. R. Suresh Kumar"],
          General: ["Dr. Prerna Sharma"],
        },
      },
    },
  },
  Bangalore: {
    hospitals: {
      "Manipal Hospital": {
        departments: {
          Cardiology: ["Dr. B. C. Srinivas", "Dr. Meghna Rao"],
          Neurology: ["Dr. Satish Sagar"],
          Orthopedics: ["Dr. Divya Pai"],
          Pediatrics: ["Dr. Shubha Nair"],
          Dermatology: ["Dr. Radhika Menon"],
          Oncology: ["Dr. Sunil Kumar V."],
          General: ["Dr. Anand Kashyap"],
        },
      },
      "Narayana Health (NH)": {
        departments: {
          Cardiology: ["Dr. Devi Prasad Shetty", "Dr. Anita Joshi"],
          "Cardiac Surgery": ["Dr. Vijay Kumar S."],
          Pediatrics: ["Dr. Rohan Shenoy"],
          General: ["Dr. Priya Suresh"],
          Nephrology: ["Dr. Ashwin Rao"],
        },
      },
      "BGS Gleneagles Global Hospital": {
        departments: {
          Neurology: ["Dr. Chandrashekar G."],
          Orthopedics: ["Dr. Suresh Babu K."],
          ENT: ["Dr. Shailaja Mani"],
          Gynecology: ["Dr. Nalini Pai"],
          General: ["Dr. Karthik Reddy"],
        },
      },
    },
  },
  Pune: {
    hospitals: {
      "Ruby Hall Clinic": {
        departments: {
          Cardiology: ["Dr. Prafulla Kerkar", "Dr. Swati Deshmukh"],
          Neurology: ["Dr. Vikas Khatri"],
          Orthopedics: ["Dr. Mahesh Naik"],
          Pediatrics: ["Dr. Aparna More"],
          General: ["Dr. Sanjay Kadam"],
        },
      },
      "Jehangir Hospital": {
        departments: {
          Cardiology: ["Dr. Rajiv Temkar"],
          Gynecology: ["Dr. Meenakshi Patil"],
          Dermatology: ["Dr. Vijay Bhave"],
          ENT: ["Dr. Deepak Wagh"],
          General: ["Dr. Priya Vaidya"],
        },
      },
      "Deenanath Mangeshkar Hospital": {
        departments: {
          Oncology: ["Dr. Suresh Bhave", "Dr. Netra Kulkarni"],
          Neurology: ["Dr. Rajesh Panse"],
          Urology: ["Dr. Anil Gokhale"],
          Gastroenterology: ["Dr. Milind Karle"],
          General: ["Dr. Amol Mandlekar"],
        },
      },
    },
  },
};

// Flatten helpers used by the controller
export function getCities() {
  return Object.keys(CITIES_DATA);
}

export function getHospitalsByCity(city) {
  return CITIES_DATA[city] ? Object.keys(CITIES_DATA[city].hospitals) : [];
}

export function getDepartmentsByHospital(city, hospital) {
  const h = CITIES_DATA[city]?.hospitals[hospital];
  return h ? Object.keys(h.departments) : [];
}

export function getDoctorsByDepartment(city, hospital, department) {
  return CITIES_DATA[city]?.hospitals[hospital]?.departments[department] || [];
}

// Find recommendations: same city → different hospital, then different city
export function findRecommendations(city, hospital, department) {
  const recs = [];

  // Same city, different hospitals
  const cityData = CITIES_DATA[city];
  if (cityData) {
    for (const [hosp, hospData] of Object.entries(cityData.hospitals)) {
      if (hosp === hospital) continue;
      const docs = hospData.departments[department] || [];
      if (docs.length > 0) {
        recs.push({ city, hospital: hosp, department, doctors: docs, tier: "same_city" });
      }
    }
  }

  if (recs.length > 0) return recs.slice(0, 2); // max 2 recs from same city

  // Different cities
  for (const [otherCity, otherCityData] of Object.entries(CITIES_DATA)) {
    if (otherCity === city) continue;
    for (const [hosp, hospData] of Object.entries(otherCityData.hospitals)) {
      const docs = hospData.departments[department] || [];
      if (docs.length > 0) {
        recs.push({ city: otherCity, hospital: hosp, department, doctors: docs, tier: "different_city" });
        if (recs.length >= 2) break;
      }
    }
    if (recs.length >= 2) break;
  }

  return recs;
}
