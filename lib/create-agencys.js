// const { createClient } = require("@supabase/supabase-js");

// const supabase = createClient()

// async function createAgencyUsers() {
//   const agencies = [
//     { email: 'contact@greenlagos.org', password: 'password123' },
//     { email: 'info@techforall.org', password: 'password123' },
//     { email: 'health@communities.org', password: 'password123' },
//     { email: 'info@greenfuturegh.org', password: 'password123' },
//     { email: 'contact@cleanwaterke.org', password: 'password123' },
//     { email: 'info@codenigeria.org', password: 'password123' },
//     { email: 'contact@coastalsenegal.org', password: 'password123' },
//     { email: 'info@healthywomenug.org', password: 'password123' },
//     { email: 'contact@readnigeria.org', password: 'password123' },
//     { email: 'info@feedfuturesa.org', password: 'password123' },
//     { email: 'contact@solarethiopia.org', password: 'password123' },
//     { email: 'info@stemsisterskenya.org', password: 'password123' },
//     { email: 'contact@careseniorsgh.org', password: 'password123' },
//     { email: 'info@recyclelagos.org', password: 'password123' },
//     { email: 'contact@learnigeria.org', password: 'password123' },
//     { email: 'info@mindmatterssa.org', password: 'password123' },
//     { email: 'contact@growethiopia.org', password: 'password123' },
//     { email: 'info@nourishuganda.org', password: 'password123' },
//     { email: 'contact@healartsenegal.org', password: 'password123' },
//     { email: 'info@parksforallnigeria.org', password: 'password123' },
//     { email: 'contact@mobilehealthgh.org', password: 'password123' },
//     { email: 'info@ecoschoolskenya.org', password: 'password123' },
//     { email: 'contact@safecommunitiesng.org', password: 'password123' }
//   ];

//   const userIds = [];
//   for (const agency of agencies) {
//     const { data, error } = await supabase.auth.admin.createUser({
//       email: agency.email,
//       password: agency.password,
//       email_confirm: true // Automatically confirm email
//     });
//     if (error) {
//       console.error(`Error creating user ${agency.email}:`, error.message);
//     } else {
//       console.log(`Created user ${agency.email} with ID: ${data.user.id}`);
//       userIds.push({ email: agency.email, id: data.user.id });
//     }
//   }

//   // Save user IDs to a temporary table or file for use in SQL
//   console.log('User IDs:', userIds);
//   return userIds;
// }

// createAgencyUsers();