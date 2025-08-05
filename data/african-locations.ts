export const africanLocations = [
  {
    country: "Nigeria",
    states: [
      {
        state: "Lagos",
        lgas: [
          "Agege",
          "Ajeromi-Ifelodun",
          "Alimosho",
          "Amuwo-Odofin",
          "Apapa",
          "Badagry",
          "Epe",
          "Eti-Osa",
          "Ibeju-Lekki",
          "Ifako-Ijaiye",
          "Ikeja",
          "Ikorodu",
          "Kosofe",
          "Lagos Island",
          "Lagos Mainland",
          "Mushin",
          "Ojo",
          "Oshodi-Isolo",
          "Shomolu",
          "Surulere",
        ],
      },
      {
        state: "Abuja (FCT)",
        lgas: ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"],
      },
      {
        state: "Rivers",
        lgas: [
          "Abua/Odual",
          "Ahoada East",
          "Ahoada West",
          "Akuku-Toru",
          "Andoni",
          "Asari-Toru",
          "Bonny",
          "Degema",
          "Eleme",
          "Emuoha",
          "Etche",
          "Gokana",
          "Ikwerre",
          "Khana",
          "Obio/Akpor",
          "Ogba/Egbema/Ndoni",
          "Ogu/Bolo",
          "Okrika",
          "Omuma",
          "Opobo/Nkoro",
          "Oyigbo",
          "Port Harcourt",
          "Tai",
        ],
      },
    ],
  },
  {
    country: "Kenya",
    states: [
      // In Kenya, these are counties, but we'll use 'states' for consistency with the model
      {
        state: "Nairobi",
        lgas: [
          "Dagoretti North",
          "Dagoretti South",
          "Embakasi Central",
          "Embakasi East",
          "Embakasi North",
          "Embakasi South",
          "Embakasi West",
          "Kamukunji",
          "Kasarani",
          "Kibra",
          "Langata",
          "Makadara",
          "Mathare",
          "Roysambu",
          "Ruaraka",
          "Starehe",
          "Westlands",
        ],
      },
      {
        state: "Mombasa",
        lgas: ["Changamwe", "Jomvu", "Kisauni", "Likoni", "Mvita", "Nyali"],
      },
    ],
  },
  {
    country: "South Africa",
    states: [
      // These are provinces in South Africa
      {
        state: "Gauteng",
        lgas: ["City of Johannesburg", "City of Tshwane", "Ekurhuleni", "Sedibeng", "West Rand"],
      },
      {
        state: "Western Cape",
        lgas: ["City of Cape Town", "Cape Winelands", "Central Karoo", "Garden Route", "Overberg", "West Coast"],
      },
    ],
  },
  {
    country: "Ghana",
    states: [
      // These are regions in Ghana
      {
        state: "Greater Accra",
        lgas: ["Accra Metropolitan", "Tema Metropolitan", "Ga East", "Ga West", "Adenta", "Ledzokuku-Krowor"],
      },
      {
        state: "Ashanti",
        lgas: ["Kumasi Metropolitan", "Obuasi Municipal", "Ejisu-Juaben Municipal"],
      },
    ],
  },
]

export const ALL_AFRICAN_STATES_FLATTENED = africanLocations.flatMap((country) =>
  country.states.map((state) => ({
    label: `${state.state}, ${country.country}`,
    value: `${state.state}, ${country.country}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  })),
)

export const ALL_AFRICAN_LGAS_FLATTENED = africanLocations.flatMap((country) =>
  country.states.flatMap((state) =>
    state.lgas.map((lga) => ({
      label: `${lga}, ${state.state}, ${country.country}`,
      value: `${lga}, ${state.state}, ${country.country}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    })),
  ),
)
