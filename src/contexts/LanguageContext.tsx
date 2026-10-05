import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LanguageCode = 'en' | 'am' | 'om' | 'ti' | 'so';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇹' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇪🇹' },
];

type TranslationKey =
  | 'hotelName' | 'hotelTagline'
  | 'nav_home' | 'nav_rooms' | 'nav_dining' | 'nav_gym' | 'nav_services'
  | 'nav_pms' | 'nav_myBookings' | 'nav_signIn' | 'nav_signOut'
  | 'service_rooms_desc' | 'service_dining_desc' | 'service_parking_desc'
  | 'service_bars_desc' | 'service_gym_desc'
  | 'hero_luxuryRooms' | 'hero_stayElegant' | 'hero_stayDesc' | 'hero_bookStay'
  | 'hero_fineDining' | 'hero_feastSenses' | 'hero_feastDesc' | 'hero_reserveTable'
  | 'hero_barsLounges' | 'hero_sipSavor' | 'hero_sipDesc' | 'hero_reserveNight'
  | 'hero_viewAllOffers' | 'hero_luxuryHotelResort'
  | 'stat_luxuryRooms' | 'stat_diningBarVenues' | 'stat_guestRating' | 'stat_concierge'
  | 'promo_signature' | 'promo_stayDineUnwind' | 'promo_subtitle'
  | 'promo_fineDining' | 'promo_fineDiningTagline' | 'promo_fineDiningDesc'
  | 'promo_barsLounges' | 'promo_barsTagline' | 'promo_barsDesc'
  | 'promo_roomsSuites' | 'promo_roomsTagline' | 'promo_roomsDesc'
  | 'promo_explore' | 'promo_intlCuisine' | 'promo_localDishes' | 'promo_privateDining'
  | 'promo_signatureCocktails' | 'promo_wineCellar' | 'promo_liveEntertainment'
  | 'promo_roomCategories' | 'promo_roomService247' | 'promo_smartControls'
  | 'offer_limited' | 'offer_title' | 'offer_desc' | 'offer_claim'
  | 'more_title' | 'more_subtitle' | 'more_gym' | 'more_gymDesc'
  | 'more_parking' | 'more_parkingDesc' | 'more_allServices' | 'more_allServicesDesc'
  | 'rooms_availableNow' | 'rooms_luxuriousAccommodations' | 'rooms_subtitle'
  | 'rooms_viewAll' | 'rooms_from' | 'rooms_night' | 'rooms_available' | 'rooms_viewDetailsBook'
  | 'features_title' | 'features_subtitle'
  | 'feature_luxuryRooms' | 'feature_luxuryRoomsDesc'
  | 'feature_primeLocation' | 'feature_primeLocationDesc'
  | 'feature_concierge' | 'feature_conciergeDesc'
  | 'feature_5star' | 'feature_5starDesc'
  | 'amenities_title' | 'amenities_subtitle'
  | 'amenity_wifi' | 'amenity_wifiDesc' | 'amenity_spa' | 'amenity_spaDesc'
  | 'amenity_fitness' | 'amenity_fitnessDesc' | 'amenity_dining' | 'amenity_diningDesc'
  | 'amenity_cafe' | 'amenity_cafeDesc' | 'amenity_valet' | 'amenity_valetDesc'
  | 'amenity_security' | 'amenity_securityDesc' | 'amenity_roomService' | 'amenity_roomServiceDesc'
  | 'gallery_title' | 'gallery_subtitle'
  | 'cta_ready' | 'cta_title' | 'cta_desc' | 'cta_bookRoom' | 'cta_reserveTable' | 'cta_bookBar'
  | 'footer_about' | 'footer_aboutDesc' | 'footer_quickLinks' | 'footer_contact' | 'footer_hours'
  | 'footer_reception' | 'footer_restaurant' | 'footer_bar' | 'footer_spa' | 'footer_rights'
  | 'login_welcomeBack' | 'login_desc' | 'login_signIn' | 'login_email' | 'login_password'
  | 'login_dontHaveAccount' | 'login_createOne' | 'login_demo'
  | 'signup_joinTeam' | 'signup_desc' | 'signup_createAccount' | 'signup_subtitle'
  | 'signup_fullName' | 'signup_emailLabel' | 'signup_passwordLabel' | 'signup_confirm'
  | 'signup_accountType' | 'signup_alreadyHaveAccount' | 'signup_signIn';

type TranslationDict = Record<TranslationKey, string>;

const en: TranslationDict = {
  hotelName: 'ወንዴ Grand Hotel and Spa',
  hotelTagline: 'PMS',
  nav_home: 'Home', nav_rooms: 'Rooms', nav_dining: 'Dining', nav_gym: 'Gym',
  nav_services: 'Services', nav_pms: 'PMS Dashboard', nav_myBookings: 'My Bookings',
  nav_signIn: 'Sign In', nav_signOut: 'Sign Out',
  service_rooms_desc: 'Book accommodations', service_dining_desc: 'Table reservations',
  service_parking_desc: 'Reserve parking spot', service_bars_desc: 'Nightlife & drinks',
  service_gym_desc: 'Workout sessions',
  hero_luxuryRooms: 'Luxury Rooms & Suites', hero_stayElegant: 'Stay in Timeless Elegance',
  hero_stayDesc: '150+ rooms and suites designed for ultimate comfort, from cozy standards to our presidential penthouse.',
  hero_bookStay: 'Book Your Stay', hero_fineDining: 'Fine Dining',
  hero_feastSenses: 'A Feast for the Senses',
  hero_feastDesc: 'Award-winning restaurants serving international cuisine and local favorites, crafted by master chefs.',
  hero_reserveTable: 'Reserve a Table', hero_barsLounges: 'Bars & Lounges',
  hero_sipSavor: 'Sip. Savor. Celebrate.',
  hero_sipDesc: 'Signature cocktails, premium spirits, and live entertainment in our stylish bars and lounges.',
  hero_reserveNight: 'Reserve a Night', hero_viewAllOffers: 'View All Offers',
  hero_luxuryHotelResort: 'Luxury Hotel & Resort',
  stat_luxuryRooms: 'Luxury Rooms', stat_diningBarVenues: 'Dining & Bar Venues',
  stat_guestRating: 'Guest Rating', stat_concierge: 'Concierge',
  promo_signature: 'Signature Experiences', promo_stayDineUnwind: 'Stay. Dine. Unwind.',
  promo_subtitle: 'Three pillars of luxury living, perfected. Explore what makes ወንዴ Grand Hotel and Spa the destination of choice.',
  promo_fineDining: 'Fine Dining', promo_fineDiningTagline: 'Award-Winning Cuisine',
  promo_fineDiningDesc: 'From Ethiopian specialties to international fine dining, our chefs craft unforgettable culinary experiences across multiple restaurants.',
  promo_barsLounges: 'Bars & Lounges', promo_barsTagline: 'Crafted Cocktails & Premium Spirits',
  promo_barsDesc: 'Unwind with signature cocktails, an extensive wine cellar, and live music in our sophisticated bars and rooftop lounge.',
  promo_roomsSuites: 'Rooms & Suites', promo_roomsTagline: 'Luxury Accommodations',
  promo_roomsDesc: 'From elegant standard rooms to our grand presidential suite, every stay features premium bedding, city views, and world-class comfort.',
  promo_explore: 'Explore', promo_intlCuisine: 'International Cuisine',
  promo_localDishes: 'Local Ethiopian Dishes', promo_privateDining: 'Private Dining Available',
  promo_signatureCocktails: 'Signature Cocktails', promo_wineCellar: 'Premium Wine Cellar',
  promo_liveEntertainment: 'Live Entertainment', promo_roomCategories: '5 Room Categories',
  promo_roomService247: '24/7 Room Service', promo_smartControls: 'Smart Room Controls',
  offer_limited: 'LIMITED OFFER', offer_title: 'Stay 3 Nights, Save 20%',
  offer_desc: 'Plus complimentary breakfast and spa access for all guests', offer_claim: 'Claim Offer',
  more_title: 'More to Explore',
  more_subtitle: 'Beyond dining, drinks, and stays — discover everything else we offer',
  more_gym: 'Gym & Fitness', more_gymDesc: 'Personal training and group classes',
  more_parking: 'Parking', more_parkingDesc: 'EV charging available on-site',
  more_allServices: 'All Services', more_allServicesDesc: 'Spa, wellness, activities and more',
  rooms_availableNow: 'Available Now', rooms_luxuriousAccommodations: 'Luxurious Accommodations',
  rooms_subtitle: 'Click any room to view photos from different angles, bed details, and book instantly',
  rooms_viewAll: 'View All Rooms', rooms_from: 'From', rooms_night: 'night',
  rooms_available: 'Available', rooms_viewDetailsBook: 'View Details & Book',
  features_title: 'Why Guests Love Us',
  features_subtitle: 'Discover what makes ወንዴ Grand Hotel and Spa the preferred choice for discerning travelers worldwide',
  feature_luxuryRooms: 'Luxury Rooms', feature_luxuryRoomsDesc: 'Elegantly appointed suites with premium amenities',
  feature_primeLocation: 'Prime Location', feature_primeLocationDesc: 'Heart of the city, minutes from attractions',
  feature_concierge: '24/7 Concierge', feature_conciergeDesc: 'Dedicated staff for personalized service',
  feature_5star: '5-Star Rated', feature_5starDesc: 'Award-winning hospitality excellence',
  amenities_title: 'World-Class Amenities',
  amenities_subtitle: 'Everything you need for a perfect stay, all under one roof',
  amenity_wifi: 'High-Speed WiFi', amenity_wifiDesc: 'Complimentary',
  amenity_spa: 'Luxury Spa', amenity_spaDesc: 'Full-service wellness',
  amenity_fitness: 'Fitness Center', amenity_fitnessDesc: 'State-of-the-art equipment',
  amenity_dining: 'Fine Dining', amenity_diningDesc: 'Award-winning restaurant',
  amenity_cafe: 'Cafe Lounge', amenity_cafeDesc: 'Artisan coffee & pastries',
  amenity_valet: 'Valet Parking', amenity_valetDesc: 'Complimentary service',
  amenity_security: '24hr Security', amenity_securityDesc: 'Safe & secure',
  amenity_roomService: 'Room Service', amenity_roomServiceDesc: 'Around the clock',
  gallery_title: 'A Visual Journey', gallery_subtitle: 'Take a glimpse into the experiences that await you',
  cta_ready: 'Ready When You Are', cta_title: 'Ready for an Unforgettable Stay?',
  cta_desc: 'Book your room, reserve a table, or plan a night out — all in one place. Our team is ready to make your experience perfect.',
  cta_bookRoom: 'Book a Room', cta_reserveTable: 'Reserve a Table', cta_bookBar: 'Book the Bar',
  footer_about: 'ወንዴ Grand Hotel and Spa',
  footer_aboutDesc: 'Experience timeless luxury in the heart of the city. Where every stay becomes a cherished memory.',
  footer_quickLinks: 'Quick Links', footer_contact: 'Contact', footer_hours: 'Hours',
  footer_reception: 'Reception: 24/7', footer_restaurant: 'Restaurant: 7am - 11pm',
  footer_bar: 'Bar: 5pm - 2am', footer_spa: 'Spa: 9am - 9pm',
  footer_rights: '© 2026 ወንዴ Grand Hotel and Spa. All rights reserved.',
  login_welcomeBack: 'Welcome Back',
  login_desc: 'Access your dashboard, manage reservations, and provide exceptional guest experiences.',
  login_signIn: 'Sign In', login_email: 'Email Address', login_password: 'Password',
  login_dontHaveAccount: "Don't have an account?", login_createOne: 'Create one',
  login_demo: 'Demo: Sign up with any email to get started. Choose your role during signup.',
  signup_joinTeam: 'Join Our Team',
  signup_desc: 'Create your account to access the hotel management system and start delivering exceptional experiences.',
  signup_createAccount: 'Create Account', signup_subtitle: 'Get started with ወንዴ Grand Hotel and Spa PMS',
  signup_fullName: 'Full Name', signup_emailLabel: 'Email', signup_passwordLabel: 'Password',
  signup_confirm: 'Confirm', signup_accountType: 'Account Type',
  signup_alreadyHaveAccount: 'Already have an account?', signup_signIn: 'Sign in',
};

const am: TranslationDict = {
  hotelName: 'ወንዴ ግራንድ ሆቴል እና ስፓ', hotelTagline: 'PMS',
  nav_home: 'መነሻ', nav_rooms: 'ክፍሎች', nav_dining: 'ምግብ', nav_gym: 'ስፖርት',
  nav_services: 'አገልግሎቶች', nav_pms: 'PMS ዳሽቦርድ', nav_myBookings: 'ቀረቡዎቼ',
  nav_signIn: 'ግባ', nav_signOut: 'ውጣ',
  service_rooms_desc: 'ክፍል ይያዙ', service_dining_desc: 'የምግብ ቤት ቀረብ',
  service_parking_desc: 'የመኪና ቦታ ይያዙ', service_bars_desc: 'ምሽት እና መጠጥ',
  service_gym_desc: 'የአካል ብቃት ክፍል',
  hero_luxuryRooms: 'የውድ ክፍሎች እና ስዊት', hero_stayElegant: 'በዘላቂ አምራትነት ይቆዩ',
  hero_stayDesc: '150+ ክፍሎች እና ስዊቶች ለጠንካራ ምቾት የተዘጋጁ።',
  hero_bookStay: 'ቆይታዎን ይያዙ', hero_fineDining: 'ምሩጥ ምግብ',
  hero_feastSenses: 'ለስሜናችሁ የሚያምር በዓል',
  hero_feastDesc: 'ሽልማት ያሸነፉ ሬስቶራንቶች ዓለም አቀፍ ምግቦች ያዘጋጁ።',
  hero_reserveTable: 'መከራ ይያዙ', hero_barsLounges: 'ባር እና ሎንጅ',
  hero_sipSavor: 'ጠጡ። ደስ ይበሉ። ይንቁ።',
  hero_sipDesc: 'ምርጥ ኮክቴሎች፣ ከፍተኛ መጠጦች እና ቀጥተኛ መዝነኛ።',
  hero_reserveNight: 'ምሽት ይያዙ', hero_viewAllOffers: 'ሁሉንም ቅናሾች ይመልከቱ',
  hero_luxuryHotelResort: 'የውድ ሆቴል እና ሪዞርት',
  stat_luxuryRooms: 'የውድ ክፍሎች', stat_diningBarVenues: 'ምግብ እና ባር ቦታዎች',
  stat_guestRating: 'የእንግዳ ደረጃ', stat_concierge: 'ኮንሲዬርጅ',
  promo_signature: 'ምልክት ልምዓት', promo_stayDineUnwind: 'ይቆዩ። ይበሉ። ያርፉ።',
  promo_subtitle: 'የውድ ህይወት ሶስት አምዶች፣ ፍጹም የተደረጉ። ወንዴ ግራንድ ሆቴልን ምርጥ መድረሻ ያድርጉ።',
  promo_fineDining: 'ምሩጥ ምግብ', promo_fineDiningTagline: 'ሽልማት ያሸነፈ ምግብ',
  promo_fineDiningDesc: 'ከኢትዮጵያዊ ልዩነቶች እስከ ዓለም አቀፍ ምሩጥ ምግብ፣ ሼፎቻችን የማይረሳ የምግብ ልምድ ይፈጥራሉ።',
  promo_barsLounges: 'ባር እና ሎንጅ', promo_barsTagline: 'የተሰሩ ኮክቴሎች እና ከፍተኛ መጠጦች',
  promo_barsDesc: 'በስታይል ባሮቻችን ምርጥ ኮክቴሎች፣ ሰፊ የወይን ቤት እና ቀጥተኛ ሙዚቃ በመጠቀም ይዝኑ።',
  promo_roomsSuites: 'ክፍሎች እና ስዊት', promo_roomsTagline: 'የውድ መኖሪያ',
  promo_roomsDesc: 'ከምሩጥ መደበኛ ክፍሎች እስከ ታላቁ ፕሬዚዳንሺያል ስዊት፣ እያንዳንዱ ቆይታ ምርጥ መኝታ ይኖረዋል።',
  promo_explore: 'ይመልከቱ', promo_intlCuisine: 'ዓለም አቀፍ ምግብ',
  promo_localDishes: 'የአካባቢ ኢትዮጵያዊ ምግቦች', promo_privateDining: 'የግል ምግብ ቤት አለ',
  promo_signatureCocktails: 'ምልክት ኮክቴሎች', promo_wineCellar: 'ከፍተኛ የወይን ቤት',
  promo_liveEntertainment: 'ቀጥተኛ መዝነኛ', promo_roomCategories: '5 የክፍል ምድቦች',
  promo_roomService247: '24/7 የክፍል አገልግሎት', promo_smartControls: 'ስማርት የክፍል ቁጥጥር',
  offer_limited: 'የገደብ ቅናሽ', offer_title: '3 ሌሊት ይቆዩ፣ 20% ይቆጥቡ',
  offer_desc: 'ለሁሉም እንግዶች ነፃ ቁርስ እና ስፓ መዳረሻ', offer_claim: 'ቅናሽ ይውሰዱ',
  more_title: 'ተጨማሪ ለመመልከት',
  more_subtitle: 'ከምግብ፣ መጠጥ እና ቆይታ በላይ — ሌላ የሚኖረውን ይመልከቱ',
  more_gym: 'ስፖርት እና አካል ብቃት', more_gymDesc: 'የግል ስልጠና እና የቡድን ክፍሎች',
  more_parking: 'የመኪና ማቆሚያ', more_parkingDesc: 'የEV መሙላት በቦታው ይገኛል',
  more_allServices: 'ሁሉም አገልግሎቶች', more_allServicesDesc: 'ስፓ፣ ጤና፣ እንቅስቃሴዎች እና ተጨማሪ',
  rooms_availableNow: 'አሁን ይገኛል', rooms_luxuriousAccommodations: 'የውድ መኖሪያዎች',
  rooms_subtitle: 'ምስሎችን ለማየት፣ የመኝታ ዝርዝሮችን እና ፈጥነው ለመመዝገብ ክፍል ይጫኑ',
  rooms_viewAll: 'ሁሉንም ክፍሎች ይመልከቱ', rooms_from: 'ከ', rooms_night: 'ሌሊት',
  rooms_available: 'ይገኛል', rooms_viewDetailsBook: 'ዝርዝር ይመልከቱ እና ይመዝገቡ',
  features_title: 'እንግዶች ለምን ይወዱናል',
  features_subtitle: 'ወንዴ ግራንድ ሆቴልን በዓለም የሚለዩ መንገደኞች ምርጥ ምርጫ የሚያደርጉት ምን እንደሆነ ይመልከቱ',
  feature_luxuryRooms: 'የውድ ክፍሎች', feature_luxuryRoomsDesc: 'በከፍተኛ እቃዎች የተሞሉ ስዊቶች',
  feature_primeLocation: 'ቀዳሚ ቦታ', feature_primeLocationDesc: 'በከተማ ልብ፣ ከመስህቦች ደቂቃዎች',
  feature_concierge: '24/7 ኮንሲዬርጅ', feature_conciergeDesc: 'ለግል አገልግሎት ቁርጠኞች ሰራተኞች',
  feature_5star: '5-ኮከብ ደረጃ', feature_5starDesc: 'ሽልማት ያሸነፈ መስህቢያ ብቃት',
  amenities_title: 'የዓለም አቀፍ እቃዎች',
  amenities_subtitle: 'ለፍጹም ቆይታ የሚያስፈልግዎት ሁሉ፣ በአንድ ጣሪያ ስር',
  amenity_wifi: 'ፈጣን ዋይፋይ', amenity_wifiDesc: 'ነፃ',
  amenity_spa: 'የውድ ስፓ', amenity_spaDesc: 'ሙሉ አገልግሎት ጤና',
  amenity_fitness: 'የአካል ብቃት ማእከል', amenity_fitnessDesc: 'ዘመናዊ መሳሪያዎች',
  amenity_dining: 'ምሩጥ ምግብ', amenity_diningDesc: 'ሽልማት ያሸነፈ ሬስቶራንት',
  amenity_cafe: 'ካፌ ሎንጅ', amenity_cafeDesc: 'የእጅ ቡና እና ጥበብ መጥሎ',
  amenity_valet: 'ቫሌት የመኪና ማቆሚያ', amenity_valetDesc: 'ነፃ አገልግሎት',
  amenity_security: '24 ሰዓት ደህንነት', amenity_securityDesc: 'ደህንና የተረጋጋ',
  amenity_roomService: 'የክፍል አገልግሎት', amenity_roomServiceDesc: 'ሙሉ ጊዜ',
  gallery_title: 'የምስል ጉዞ', gallery_subtitle: 'የሚጠብቁዎትን ልምዓቶች ጥቂት ይመልከቱ',
  cta_ready: 'ዝግጁ ነዎት', cta_title: 'ለማይረሳ ቆይታ ዝግጁ ነዎት?',
  cta_desc: 'ክፍልዎን ይመዝገቡ፣ መከራ ይያዙ፣ ወይም ምሽት ያቅዱ — ሁሉም በአንድ ቦታ።',
  cta_bookRoom: 'ክፍል ይመዝገቡ', cta_reserveTable: 'መከራ ይያዙ', cta_bookBar: 'ባር ይመዝገቡ',
  footer_about: 'ወንዴ ግራንድ ሆቴል እና ስፓ',
  footer_aboutDesc: 'በከተማ ልብ ዘላቂ ውድነትን ይለማመዱ። እያንዳንዱ ቆይታ ወደ ተወደደ ትውስታ ይለወጣል።',
  footer_quickLinks: 'ፈጣን አገናኞች', footer_contact: 'ማነጋገሪያ', footer_hours: 'ሰዓታት',
  footer_reception: 'ሬሴፕሽን፡ 24/7', footer_restaurant: 'ሬስቶራንት፡ 7ጠዋት - 11ማታ',
  footer_bar: 'ባር፡ 5ማታ - 2ሌሊት', footer_spa: 'ስፓ፡ 9ጠዋት - 9ማታ',
  footer_rights: '© 2026 ወንዴ ግራንድ ሆቴል እና ስፓ። ሁሉም መብቶች የተጠበቁ ናቸው።',
  login_welcomeBack: 'እንኳን ደህና መጡ',
  login_desc: 'ዳሽቦርድዎን ይድረሱ፣ ቀረቦችን ያስተዳድሩ፣ እና ምሩጥ የእንግዳ ልምድ ይስጡ።',
  login_signIn: 'ግባ', login_email: 'የኢሜይል አድራሻ', login_password: 'የይለፍ ቃል',
  login_dontHaveAccount: 'መለያ የለዎትም?', login_createOne: 'ይፍጠሩ',
  login_demo: 'ማሳያ፡ ለመጀመር በማንኛውም ኢሜይል ይመዝገቡ። በምዝገባ ወቅት ሚናዎን ይምረጡ።',
  signup_joinTeam: 'ቡድናችንን ይቀላቀሉ',
  signup_desc: 'የሆቴል አስተዳደር ስርዓት ለመድረስ መለያ ይፍጠሩ እና ምሩጥ ልምዓቶችን ለማቅረብ ይጀምሩ።',
  signup_createAccount: 'መለያ ይፍጠሩ', signup_subtitle: 'ከወንዴ ግራንድ ሆቴል እና ስፓ PMS ጋር ይጀምሩ',
  signup_fullName: 'ሙሉ ስም', signup_emailLabel: 'ኢሜይል', signup_passwordLabel: 'የይለፍ ቃል',
  signup_confirm: 'ያረጋግጡ', signup_accountType: 'የመለያ አይነት',
  signup_alreadyHaveAccount: 'መለያ አለዎት?', signup_signIn: 'ግባ',
};

const om: TranslationDict = {
  ...en,
  hotelName: 'ወንዴ Grand Hotel and Spa',
  nav_home: 'Mana', nav_rooms: 'Kutaalee', nav_dining: 'Nyata', nav_gym: 'Leenjii',
  nav_services: 'Tajaajila', nav_pms: 'PMS Dashboordii', nav_myBookings: 'Kabajaa koo',
  nav_signIn: 'Seeni', nav_signOut: "Ba'i",
  service_rooms_desc: 'Kutaa kaa\'i', service_dining_desc: 'Tapha kabajaa',
  service_parking_desc: 'Bakkaa konfoo kaa\'i', service_bars_desc: 'Halkanii fi dhugaatii',
  service_gym_desc: "Ho'ii leenjii",
  hero_luxuryRooms: 'Kutaalee fi Suweetii baay\'ee barbaadamaa',
  hero_stayElegant: 'Jechoota daran haa jiraattu',
  hero_stayDesc: 'Kutaalee fi suweetii 150+ qofa haa ta\'u, dirqama kan qabataman.',
  hero_bookStay: 'Kabajaa kee kaa\'i', hero_fineDining: 'Nyata gaarii',
  hero_feastSenses: 'Miidhaaafi jaalalaaf nyata',
  hero_feastDesc: 'Badhaasa argatteen reesitarantoota nyata addunyaa qophaa\'e.',
  hero_reserveTable: 'Tapha kabajaa kaa\'i', hero_barsLounges: 'Baaroota fi Loonjee',
  hero_sipSavor: 'Dhugi. Gaarii qabu. Bajjaneessu.',
  hero_sipDesc: 'Kookteelee addaan qabataman, raawaa olaanaa fi shaabgamaa.',
  hero_reserveNight: 'Halkan kaa\'i', hero_viewAllOffers: "Waa'ee hunda ilaali",
  hero_luxuryHotelResort: 'Hoteela fi Riizoortii barbaadamaa',
  stat_luxuryRooms: 'Kutaalee barbaadamaa', stat_diningBarVenues: 'Nyata fi Baar bakkaa',
  stat_guestRating: 'Sadarkaa daawwitaa', stat_concierge: 'Konsiyeerji',
  promo_signature: 'Morkataa addaa', promo_stayDineUnwind: 'Jiraadha. Nyadhua. Boqonnaa.',
  promo_subtitle: 'Jireenya baay\'ee barbaadamaa kan sadarkaa sadii. ወንዴ Grand Hotel and Spa gaarii ta\'uu ishee beekuu.',
  promo_fineDining: 'Nyata gaarii', promo_fineDiningTagline: 'Badhaasa argatteen nyata',
  promo_fineDiningDesc: 'Galmee Oromoo addaa irraa kaasee hanga nyata addunyaa.',
  promo_barsLounges: 'Baaroota fi Loonjee', promo_barsTagline: 'Kookteelee kan hojjetame fi raawaa olaanaa',
  promo_barsDesc: 'Kookteelee addaa, waa\'ee waan dhugaatii bal\'aa fi muuziqaa.',
  promo_roomsSuites: 'Kutaalee fi Suweetii', promo_roomsTagline: 'Olaanaa jireenya',
  promo_roomsDesc: 'Kutaalee barbaadamaa irraa kaasee hanga suweetii pirezidaantii.',
  promo_explore: 'Ilaali', promo_intlCuisine: 'Nyata addunyaa',
  promo_localDishes: 'Nyata Oromoo naannoo', promo_privateDining: 'Nyata dhuunfakkaataa jira',
  promo_signatureCocktails: 'Kookteelee addaa', promo_wineCellar: 'Waani waayinii olaanaa',
  promo_liveEntertainment: 'Shaabgamaa kallattii', promo_roomCategories: 'Gosoota kutaa 5',
  promo_roomService247: 'Tajaajila kutaa 24/7', promo_smartControls: "Too'innaa kutaa smartii",
  offer_limited: 'Gabaasa daangaawaa', offer_title: 'Halkan 3 jiraadhaa, 20% qusadhaa',
  offer_desc: 'Kabajaa qofa nyata birraanii fi tajaajila spa waan hunda dhugaafee',
  offer_claim: 'Gabaasa fudhadhaa',
  more_title: 'Dabalata ilaali',
  more_subtitle: 'Nyata, dhugaatii fi jireenya kan booda — waan biraa hunda ilaali',
  more_gym: "Leenjii fi Ho'ii", more_gymDesc: 'Leenjii dhuunfakkaataa fi garee',
  more_parking: 'Bakkaa konfoo', more_parkingDesc: 'EV charge bakkaa irratti jira',
  more_allServices: 'Tajaajila hunda', more_allServicesDesc: 'Spa, fayyaa, sochii fi dabalata',
  rooms_availableNow: 'Amma jira', rooms_luxuriousAccommodations: 'Olaanaa jireenya',
  rooms_subtitle: 'Suuraa ilaali, balaa dirree fi sagalee ilaaluu fi kabajaa dabarsaa kutaa cuqaami',
  rooms_viewAll: 'Kutaalee hunda ilaali', rooms_from: 'Irraa', rooms_night: 'Halkan',
  rooms_available: 'Jira', rooms_viewDetailsBook: "Balaa ilaali fi kabajaa kaa'i",
  features_title: 'Maaliif daawwitonni nu jaallatu',
  features_subtitle: 'ወንዴ Grand Hotel and Spa addunyaa mara daawwitaa addaa filannoo ta\'uu ishee beekuu',
  feature_luxuryRooms: 'Kutaalee barbaadamaa', feature_luxuryRoomsDesc: 'Suweetii meeshaa olaanaa qabu',
  feature_primeLocation: 'Bakkaa guddoo', feature_primeLocationDesc: 'Magaalaa guddaa, daqiiqaaAdda irraa',
  feature_concierge: '24/7 Konsiyeerji', feature_conciergeDesc: 'Hojjetoota tajaajila dhuunfakkaataaf',
  feature_5star: '5-Urjii sadarkaa', feature_5starDesc: 'Badhaasa argattee jaalala gudduu',
  amenities_title: 'Meershaa addunyaa sadarkaa',
  amenities_subtitle: 'Wanti jireenya guutuu keessatti haa barbaachisu hunda, daangaa tokko jala',
  amenity_wifi: 'WiFi saffisa olaa', amenity_wifiDesc: 'Bilaadfa',
  amenity_spa: 'Spa baay\'ee barbaadamaa', amenity_spaDesc: 'Tajaajila fayyaa guutuu',
  amenity_fitness: 'Kibba leenjii', amenity_fitnessDesc: 'Meershaa haaraa',
  amenity_dining: 'Nyata gaarii', amenity_diningDesc: 'Reesitarantii badhaasa',
  amenity_cafe: 'Kafee Loonjee', amenity_cafeDesc: 'Bunaanii fi paastirii',
  amenity_valet: 'Baqayna Vaale', amenity_valetDesc: 'Tajaajila bilaadfa',
  amenity_security: 'Eegumsa 24 sa\'a', amenity_securityDesc: 'Nageenya qabu',
  amenity_roomService: 'Tajaajila kutaa', amenity_roomServiceDesc: 'Sa\'a hunda',
  gallery_title: 'Safara suuraa', gallery_subtitle: 'Lubbuu kee eegalu beekuu irraa xiqqoo ilaali',
  cta_ready: "Gaaritti qophaa'e jirta", cta_title: "Jireenya hin faguu qabduuf qophaa'eetta?",
  cta_desc: 'Kutaa kabajii, tapha kabajaa, ykn halkan kabajuu — bakka tokko keessatti.',
  cta_bookRoom: 'Kutaa kabajii', cta_reserveTable: "Tapha kabajaa kaa'i", cta_bookBar: 'Baar kabajii',
  footer_about: 'ወንዴ Grand Hotel and Spa',
  footer_aboutDesc: 'Magaalaa guddaa keessatti jaalala guutuu haa beektu. Jireenya haa ta\'u kan yaadatamuu hin fage.',
  footer_quickLinks: 'Walitti qabatamaa', footer_contact: 'Qunnamaa', footer_hours: "Sa'a",
  footer_reception: 'Riseenshini: 24/7', footer_restaurant: 'Reesitarantii: 7wm - 11hd',
  footer_bar: 'Baar: 5hd - 2h', footer_spa: 'Spa: 9wm - 9hd',
  footer_rights: '© 2026 ወንዴ Grand Hotel and Spa. Haa haa mirga hunda eegame.',
  login_welcomeBack: 'Akkam bultan',
  login_desc: 'Dashboordii kee seenii, kabajaa bulchi, fi jireenya daawwitaa gaarii kenni.',
  login_signIn: 'Seeni', login_email: 'Teessoo imeeyilii', login_password: 'Jechoota icciti',
  login_dontHaveAccount: 'Lakkoofsa qabdu jirtaa?', login_createOne: 'Uumi',
  login_demo: 'Akeekuu: Imeyilii kamiinuu galmaa\'ii eegaluu. Galmaa\'uu kee irraa gahee filadhuu.',
  signup_joinTeam: 'Garee keenyaitti makamii',
  signup_desc: 'Sirna bulchiinsa hoteelaa ga\'uuuf lakkoofsa uumi fi jireenya gaarii kennuu eegali.',
  signup_createAccount: 'Lakkoofsa uumi', signup_subtitle: 'ወንዴ Grand Hotel and Spa PMS wajjin eegali',
  signup_fullName: 'Maqaa guutuu', signup_emailLabel: 'Imeeyilii', signup_passwordLabel: 'Jechoota icciti',
  signup_confirm: 'Mirkaneessaa', signup_accountType: 'Gosoo lakkoofsa',
  signup_alreadyHaveAccount: 'Lakkoofsa qabdaa?', signup_signIn: 'Seeni',
};

const ti: TranslationDict = {
  ...en,
  hotelName: 'ወንዴ ግራንድ ሆቴል ከመልእኽቲ ስፓ',
  nav_home: 'ቤት', nav_rooms: 'ክፍልታት', nav_dining: 'ምግቢ', nav_gym: 'ስፖርት',
  nav_services: 'ኣገልግሎታት', nav_pms: 'PMS ዳሽቦርድ', nav_myBookings: 'ቕረባተይ',
  nav_signIn: 'እቶ', nav_signOut: 'ውጻእ',
  service_rooms_desc: 'ክፍል ዓቕብ', service_dining_desc: 'ሰሌዳ ቕረብ',
  service_parking_desc: 'ናይ መኪና ቦታ ዓቕብ', service_bars_desc: 'ምሸትን መስተታን',
  service_gym_desc: 'ናይ ኣካል ብቕዕነት ክፍሊ',
  hero_luxuryRooms: 'ናይ ዋጋ ክፍልታትን ስዊትታትን', hero_stayElegant: 'ብዘላቂ ውቕጣት ተቐመጥዎ',
  hero_stayDesc: '150+ ክፍልታትን ስዊትታትን ንምዕባል ምቾት ዝተዳለዉ።',
  hero_bookStay: 'ቆይታኹም ዓቕቡ', hero_fineDining: 'ምሩእ ምግቢ',
  hero_feastSenses: 'ንስሜኹም ዝውንን በዓል',
  hero_feastDesc: 'ሽልማት ዝሓዙ ሬስቶራንቶች ናይ ዓለም ምግብ ዝዳለዉ።',
  hero_reserveTable: 'ሰሌዳ ዓቕቡ', hero_barsLounges: 'ባርን ሎንጅን',
  hero_sipSavor: 'ስተይ። ደስ በሉ። ኣኽብሩ።',
  hero_sipDesc: 'ምርጥ ኮክቴላት፡ ከፊቲ መስተታትን ቀጥባዊ መዝነኛን።',
  hero_reserveNight: 'ምሸት ዓቕቡ', hero_viewAllOffers: 'ኩሉ ኣቕርባታ ርእዩ',
  hero_luxuryHotelResort: 'ናይ ዋጋ ሆቴልን ሪዞርትን',
  stat_luxuryRooms: 'ናይ ዋጋ ክፍልታት', stat_diningBarVenues: 'ምግቢን ባር ቦታታትን',
  stat_guestRating: 'ናይ እንግዳ ደረጃ', stat_concierge: 'ኮንሲዬርጅ',
  promo_signature: 'ምልክቲ ልምዓት', promo_stayDineUnwind: 'ተቐመጥዎ። ብሉ። ኣርምዎ።',
  promo_subtitle: 'ናይ ዋጋ ህይወት ሰለስተ ምድር፡ ፍጹም ዝተገብረ። ወንዴ ግራንድ ሆቴልን ስፓን ምርጥ መድረኽ ግበሩ።',
  promo_fineDining: 'ምሩእ ምግቢ', promo_fineDiningTagline: 'ሽልማት ዝሓዘ ምግቢ',
  promo_fineDiningDesc: 'ካብ ናይ ኢትዮጵያ ልዑል ክሳብ ናይ ዓለም ምሩእ ምግቢ።',
  promo_barsLounges: 'ባርን ሎንጅን', promo_barsTagline: 'ዝተሰሩ ኮክቴላትን ከፊቲ መስተታትን',
  promo_barsDesc: 'ኣብ ስታይል ባርን ሮክቶፕ ሎንጅና ምርጥ ኮክቴላት፡ ሰፊ ዓይኒ ቤትን ቀጥባዊ ሙዚቃን።',
  promo_roomsSuites: 'ክፍልታትን ስዊትታትን', promo_roomsTagline: 'ናይ ዋጋ መኖሪያ',
  promo_roomsDesc: 'ካብ ምሩእ መቐደስ ክፍልታት ክሳብ ሓይልያ ፕሬዚዳንሺያል ስዊት።',
  promo_explore: 'ርእዩ', promo_intlCuisine: 'ናይ ዓለም ምግቢ',
  promo_localDishes: 'ናይ ከባቢ ኢትዮጵያዊ ምግባት', promo_privateDining: 'ናይ ውልቂ ምግቢ ቤት ኣሎ',
  promo_signatureCocktails: 'ምልክቲ ኮክቴላት', promo_wineCellar: 'ከፊቲ ዓይኒ ቤት',
  promo_liveEntertainment: 'ቀጥባዊ መዝነኛ', promo_roomCategories: '5 ናይ ክፍል ምድባት',
  promo_roomService247: '24/7 ናይ ክፍል ኣገልግሎት', promo_smartControls: 'ስማርት ናይ ክፍል ቁጥጥር',
  offer_limited: 'ናይ ወሰን ኣቕርባታ', offer_title: '3 ለይ ተቐመጥዎ፡ 20% ቕጠቕ',
  offer_desc: 'ንኩሉ እንግዳ ነፃ ቁርሲን ስፓ መዳረሺን', offer_claim: 'ኣቕርባታ ሓዙ',
  more_title: 'ተጨማሪ ንምርኣይ',
  more_subtitle: 'ካብ ምግቢ፡ መስተታን ቆይታን ሓሊፉ — ካልእ ዘሎ ርእዩ',
  more_gym: 'ስፖርትን ኣካል ብቕዕነትን', more_gymDesc: 'ናይ ውልቂ ስልጠናን ናይ ቡድን ክፍልታትን',
  more_parking: 'ናይ መኪና ማቆሚያ', more_parkingDesc: 'EV ምምላእ ኣብ ቦታ ኣሎ',
  more_allServices: 'ኩሉ ኣገልግሎታት', more_allServicesDesc: 'ስፓ፡ ጤና፡ ንጥፈታትን ተጨማሪን',
  rooms_availableNow: 'ሕጂ ኣሎ', rooms_luxuriousAccommodations: 'ናይ ዋጋ መኖሪያታት',
  rooms_subtitle: 'ስእልታት ንምርኣይ፡ ናይ መኝታ ዝርዝርን ቅልጣፍ ንምዕጻው ክፍል ጠውቑ',
  rooms_viewAll: 'ኩሉ ክፍልታት ርእዩ', rooms_from: 'ካብ', rooms_night: 'ለይ',
  rooms_available: 'ኣሎ', rooms_viewDetailsBook: 'ዝርዝር ርእዩን ዓቕቡን',
  features_title: 'እንግዳ ስለምንታይ ይፈትዉና',
  features_subtitle: 'ወንዴ ግራንድ ሆቴልን ስፓን ኣብ ዓለም ዝምልከቱ መንገዲታት ምርጥ ምርጫ ዝግበርዎ ምንታይ ምዃኑ ርእዩ',
  feature_luxuryRooms: 'ናይ ዋጋ ክፍልታት', feature_luxuryRoomsDesc: 'ብከፊቲ እቃታት ዝተመልአሉ ስዊትታት',
  feature_primeLocation: 'ቀዳማይ ቦታ', feature_primeLocationDesc: 'ኣብ ልቢ ከተማ፡ ካብ ስሕባታት ደቓይቕ',
  feature_concierge: '24/7 ኮንሲዬርጅ', feature_conciergeDesc: 'ንውልቂ ኣገልግሎት ዝተዓጠቐ ሰራሕተኛታት',
  feature_5star: '5-ኮከብ ደረጃ', feature_5starDesc: 'ሽልማት ዝሓዘ ስሕበት ብቕዕነት',
  amenities_title: 'ናይ ዓለም ክብሪ እቃታት',
  amenities_subtitle: 'ንፍጹም ቆይታ ዝድልየኩም ኩሉ፡ ኣብ ሓደ ዳርጻዕ',
  amenity_wifi: 'WiFi ብቕዓት ሰፊሕ', amenity_wifiDesc: 'ነፃ',
  amenity_spa: 'ስፓ ዋጋ', amenity_spaDesc: 'ምሉእ ኣገልግሎት ጥዕና',
  amenity_fitness: 'ማእከል ብቕዕነት', amenity_fitnessDesc: 'ኣውታሪ ዘመናዊ',
  amenity_dining: 'ምሩእ ምግቢ', amenity_diningDesc: 'ሬስቶራንት ሽልማት',
  amenity_cafe: 'ካፌ ሎንጅ', amenity_cafeDesc: 'ቡና እና ጥበብ',
  amenity_valet: 'ቫሌት ማቆሚያ', amenity_valetDesc: 'ነፃ ኣገልግሎት',
  amenity_security: '24 ሰዓት ምሕዋር', amenity_securityDesc: 'ደህንነት ዘለዎ',
  amenity_roomService: 'ኣገልግሎት ክፍል', amenity_roomServiceDesc: 'ሰዓት ኩሉ',
  gallery_title: 'ናይ ስእሊ ጉዞ', gallery_subtitle: 'ዝጸበቓኹም ልምዓታት ጥቕሪ ርእዩ',
  cta_ready: 'ዝግጁ ኣሎኹም', cta_title: 'ንዘይምርሳዕ ቆይታ ዝግጁ ኢኹም?',
  cta_desc: 'ክፍልኹም ዓቕቡ፡ ሰሌዳ ዓቕቡ፡ ወይ ምሸት ኣቕርቡ — ኩሉ ኣብ ሓደ ቦታ።',
  cta_bookRoom: 'ክፍል ዓቕቡ', cta_reserveTable: 'ሰሌዳ ዓቕቡ', cta_bookBar: 'ባር ዓቕቡ',
  footer_about: 'ወንዴ ግራንድ ሆቴል ከመልእኽቲ ስፓ',
  footer_aboutDesc: 'ኣብ ልቢ ከተማ ዘላቂ ዋጋ ልምዑ። ኩሉ ቆይታ ናብ ዝተወደዐ ምዝራዝ ይቕየር።',
  footer_quickLinks: 'ቅልጣፍ መሓዛታት', footer_contact: 'ርክብ', footer_hours: 'ሰዓታት',
  footer_reception: 'ሬሴፕሽን፡ 24/7', footer_restaurant: 'ሬስቶራንት፡ 7ንቐድስን - 11ንምሸትን',
  footer_bar: 'ባር፡ 5ንምሸትን - 2ንለይን', footer_spa: 'ስፓ፡ 9ንቀድስን - 9ንምሸትን',
  footer_rights: '© 2026 ወንዴ ግራንድ ሆቴል ከመልእኽቲ ስፓ። ኩሉ መሰላት እተሓተቱ እዮም።',
  login_welcomeBack: 'እኳን ደህን መጻእኹም',
  login_desc: 'ናብ ዳሽቦርድኹም በጹ፡ ቕረባታት ኣመሓድርዎ፡ ከመልእኽቲ ኣገልግሎት ምሩእ ልምዓት ልልኩ።',
  login_signIn: 'እቶ', login_email: 'ናይ ኢመይል ኣድራሻ', login_password: 'ናይ መሕለፊ ቃል',
  login_dontHaveAccount: 'ሕሳብ የብልኩምን?', login_createOne: 'ፍጠሩ',
  login_demo: 'ናይ ምስኣን፡ ብዝኾነ ኢመይል ተመዝገቡ ንምንታይ። ኣብ እዋን ምዝገባ ሓላፍነትኹም ምረጹ።',
  signup_joinTeam: 'ናብ ስራሕና ተዐኻክሩ',
  signup_desc: 'ናይ ሆቴል ኣመሓዳሪነት ስርዓት ንምድራስ ሕሳብ ፍጠሩን ምሩእ ልምዓታት ንምኽትታል ንዕዘዩ።',
  signup_createAccount: 'ሕሳብ ፍጠሩ', signup_subtitle: 'ካብ ወንዴ ግራንድ ሆቴል ከመልእኽቲ ስፓ PMS ክስተቱ',
  signup_fullName: 'ምሉእ ሽም', signup_emailLabel: 'ኢመይል', signup_passwordLabel: 'ናይ መሕለፊ ቃል',
  signup_confirm: 'ኣረጋግጹ', signup_accountType: 'ናይ ሕሳብ ዓይነት',
  signup_alreadyHaveAccount: 'ሕሳብ ኣለኩም?', signup_signIn: 'እቶ',
};

const so: TranslationDict = {
  ...en,
  hotelName: 'ወንዴ Grand Hotel and Spa',
  nav_home: 'Guriga', nav_rooms: 'Qolofyada', nav_dining: 'Cunto', nav_gym: 'Dhalinyarada',
  nav_services: 'Adeegyo', nav_pms: 'PMS Booska', nav_myBookings: 'Booskaygayga',
  nav_signIn: 'Gal', nav_signOut: 'Ka bax',
  service_rooms_desc: 'Qolof boosayso', service_dining_desc: 'Mead boosayso',
  service_parking_desc: 'Baqay boosayso', service_bars_desc: 'Habeen iyo cabitaan',
  service_gym_desc: 'Tababar shaqo',
  hero_luxuryRooms: 'Qolofyada iyo Swiitada qaali ah', hero_stayElegant: 'Ku waara dhaqan wanaagsan',
  hero_stayDesc: '150+ qolofyo iyo swiitada loo abuuray raaxada ugu saraysa.',
  hero_bookStay: 'Booskaaga qabo', hero_fineDining: 'Cunto wanaagsan',
  hero_feastSenses: 'Majaajil dareenkaaga',
  hero_feastDesc: 'Restorannooyin abaalmarin ku gaaray cunto add WN iyo doorashooyinka maxallu ah.',
  hero_reserveTable: 'Mead boosayso', hero_barsLounges: 'Baararka iyo Laanaha',
  hero_sipSavor: 'Cab. Dhadhamay. Nabarro.',
  hero_sipDesc: 'Cocktails caan ah, khamri sare, iyo madadaalo toogta.',
  hero_reserveNight: 'Habeen boosayso', hero_viewAllOffers: 'Dhammaan qandaraasyada eeg',
  hero_luxuryHotelResort: 'Hotel iyo Resort qaali ah',
  stat_luxuryRooms: 'Qolofyada qaali ah', stat_diningBarVenues: 'Cunto iyo Baar meelo',
  stat_guestRating: 'Qiimaynta martida', stat_concierge: 'Concierge',
  promo_signature: 'Khibrad calaamadeysan', promo_stayDineUnwind: 'Waaro. Cun. Dekaato.',
  promo_subtitle: 'Saddex tiill oo nolol qaali ah, oo si fiican u dhameeyn. ወንዴ Grand Hotel and Spa meesha loo doorto.',
  promo_fineDining: 'Cunto wanaagsan', promo_fineDiningTagline: 'Cunto abaalmarin ku gaaray',
  promo_fineDiningDesc: 'Laga bilaabo khaasada Itoobiya ilaa cunto caalami ah.',
  promo_barsLounges: 'Baararka iyo Laanaha', promo_barsTagline: 'Cocktails la sameeyay iyo khamri sare',
  promo_barsDesc: 'Ku naso cocktails caan ah, khamri waa weyn, iyo muusig toogta ah.',
  promo_roomsSuites: 'Qolofyada iyo Swiitada', promo_roomsTagline: 'Hoy qaali ah',
  promo_roomsDesc: 'Laga bilaabo qolofyada caadiga ah ee wanaagsan ilaa swiitada rayidka.',
  promo_explore: 'Doodo', promo_intlCuisine: 'Cunto caalami ah',
  promo_localDishes: 'Cunto Itoobiya ah maxallu ah', promo_privateDining: 'Cunto gaar ah oo jira',
  promo_signatureCocktails: 'Cocktails calaamadeysan', promo_wineCellar: 'Khamri sare waa weyn',
  promo_liveEntertainment: 'Madadaalo toogta', promo_roomCategories: '5 nooc oo qolofyo ah',
  promo_roomService247: '24/7 Adeeg qolof', promo_smartControls: 'Kontaroolka qolofka caqliga leh',
  offer_limited: 'QANDARAAS XADAN', offer_title: '3 habeen waaro, 20% badbaadi',
  offer_desc: 'Loo qoray quraac bilaash ah iyo gelitaanka spa ee dhammaan martida',
  offer_claim: 'Qandaraas qaad',
  more_title: 'Wax badan eeg',
  more_subtitle: 'Ka sokow cunto, cabitaan, iyo waayo — wax kasta oo kale ee aan hayno eeg',
  more_gym: 'Dhalinyarada iyo Tababarka', more_gymDesc: 'Tababar gaar ah iyo fasalada koox',
  more_parking: 'Baqaynta', more_parkingDesc: 'EV charging meesha la jira ayaa jira',
  more_allServices: 'Dhammaan adeegyada', more_allServicesDesc: 'Spa, caafimaad, shaqooyin iyo wax badan',
  rooms_availableNow: 'Hadda waa jira', rooms_luxuriousAccommodations: 'Hoy qaali ah',
  rooms_subtitle: 'Sawir eeg, fasalka sariito eeg, iyo dhaqso u qolof booqan',
  rooms_viewAll: 'Dhammaan qolofyada eeg', rooms_from: 'Ka', rooms_night: 'habeen',
  rooms_available: 'Waa jira', rooms_viewDetailsBook: 'Faahfaahsha eeg iyo booqso',
  features_title: 'Sababta martida inaga jecel yihiin',
  features_subtitle: 'ወንዴ Grand Hotel and Spa ee adduunka soo deddh qofab sareeya doorato sababta ay tahay eeg',
  feature_luxuryRooms: 'Qolofyada qaali ah', feature_luxuryRoomsDesc: 'Swiitada qalab sare oo buuxsamay',
  feature_primeLocation: 'Goobta ugu muhiimsan', feature_primeLocationDesc: 'Magaalada dhexdeeda, daqiiqadaha laga xiga',
  feature_concierge: '24/7 Concierge', feature_conciergeDesc: 'Shaqaalayaal diyaar u ah adeeg gaar ah',
  feature_5star: '5-Xiddig qiimaysan', feature_5starDesc: 'Abaalmarin ku gaaray kalgacal wanaag',
  amenities_title: 'Qalab caalami ah',
  amenities_subtitle: 'Wixii kugu baahan waqtiga qaali ah dhammaan, hal saqaf hoostiisa',
  amenity_wifi: 'WiFi xawaare sare', amenity_wifiDesc: 'Bilaash',
  amenity_spa: 'Spa qaali ah', amenity_spaDesc: 'Adeeg caafimaad buuxa',
  amenity_fitness: 'Xarunta Tababarka', amenity_fitnessDesc: 'Qalab casri ah',
  amenity_dining: 'Cunto wanaagsan', amenity_diningDesc: 'Restoran abaalmarin',
  amenity_cafe: 'Kafe Lounge', amenity_cafeDesc: 'Bunno fi dibadh-farto',
  amenity_valet: 'Baqayn Valet', amenity_valetDesc: 'Adeeg bilaash',
  amenity_security: '24hr Ammaanka', amenity_securityDesc: 'Ammiin fi nabad',
  amenity_roomService: 'Adeeg Qolof', amenity_roomServiceDesc: 'Saacad dhan',
  gallery_title: 'Safarka sawirka', gallery_subtitle: 'Khibrado kuu sugan qodob eeg',
  cta_ready: 'Diyaar baad tahay', cta_title: 'Diyaar ma tahay waqti lama ilaawaan?',
  cta_desc: 'Qolof booqso, mead boosayso, ama habeen qorsheed — dhammaan hal meel. Kooxdeenu khibradaada si buuxda u sameesha.',
  cta_bookRoom: 'Qolof booqso', cta_reserveTable: 'Mead boosayso', cta_bookBar: 'Baar booqso',
  footer_about: 'ወንዴ Grand Hotel and Spa',
  footer_aboutDesc: 'Magaalada dhexdeeda kalgacal wanaag waara xusuus. Waqti walba waa waqti lama ilaawaan.',
  footer_quickLinks: 'Isku xirka dhaqsaha', footer_contact: 'Lagu soo xidhiidho', footer_hours: 'Saacadaha',
  footer_reception: 'Salaamaha: 24/7', footer_restaurant: 'Restoranka: 7 subaxnimo - 11 galabnimo',
  footer_bar: 'Baarka: 5 galabnimo - 2 habeen', footer_spa: 'Spa: 9 subaxnimo - 9 galabnimo',
  footer_rights: '© 2026 ወንዴ Grand Hotel and Spa. Dhammaan xuquuqda waa la ilaaliyay.',
  login_welcomeBack: 'Soo dhawoow',
  login_desc: 'Booskaaga gal, booska maamul, iyo khibrad wanaagsan ee martida si.',
  login_signIn: 'Gal', login_email: 'Ciwaanka iimaylka', login_password: 'Ereyada sirta ah',
  login_dontHaveAccount: 'Ma jirtaa akoon?', login_createOne: 'Abuur',
  login_demo: 'Tijaabada: Iimayl kasta oo gal si aad u bilowdo. Waqtiga galitaanka doorato dooradaada.',
  signup_joinTeam: 'Kooheena ku biir',
  signup_desc: 'Akoon abuur si aad u gasho nidaamka maamulka hotelka iyo bilowga siinta khibradaha wanaagsan.',
  signup_createAccount: 'Akoon abuur', signup_subtitle: 'Ka bilow ወንዴ Grand Hotel and Spa PMS',
  signup_fullName: 'Magaca buuxa', signup_emailLabel: 'Iimayl', signup_passwordLabel: 'Ereyada sirta ah',
  signup_confirm: 'Xaqiiji', signup_accountType: 'Nooca akoonka',
  signup_alreadyHaveAccount: 'Akoon ma haysataa?', signup_signIn: 'Gal',
};

const translations: Record<LanguageCode, TranslationDict> = { en, am, om, ti, so };

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'hotel-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && ['en', 'am', 'om', 'ti', 'so'].includes(saved)) {
        return saved as LanguageCode;
      }
    }
    return 'en';
  });

  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
