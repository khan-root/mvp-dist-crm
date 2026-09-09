export interface CityItem {
  name: string;
  province: string;
  population?: number;
  capital?: boolean;
  lat?: string;
  lng?: string;
  iso2?: string;
}

export const CITIES_DATA: CityItem[] = [
  // ============================================
  // PUNJAB (All Major Cities & Districts)
  // ============================================
  { name: "Lahore", province: "Punjab", population: 12306000, capital: true, lat: "31.5497", lng: "74.3436", iso2: "PK" },
  { name: "Faisalabad", province: "Punjab", population: 3203846, lat: "31.4167", lng: "73.0911", iso2: "PK" },
  { name: "Rawalpindi", province: "Punjab", population: 2098231, lat: "33.6000", lng: "73.0333", iso2: "PK" },
  { name: "Gujranwala", province: "Punjab", population: 2027001, lat: "32.1567", lng: "74.1900", iso2: "PK" },
  { name: "Multan", province: "Punjab", population: 1871843, lat: "30.1978", lng: "71.4697", iso2: "PK" },
  { name: "Kotla Qasim Khan", province: "Punjab", population: 3219375, lat: "32.5833", lng: "73.7500", iso2: "PK" },
  { name: "Cantonment", province: "Punjab", population: 374872, lat: "31.5167", lng: "74.3833", iso2: "PK" },
  { name: "Bahawalpur", province: "Punjab", population: 762111 },
  { name: "Sargodha", province: "Punjab", population: 659862 },
  { name: "Sialkot", province: "Punjab", population: 655852 },
  { name: "Chiniot", province: "Punjab", population: 477781 },
  { name: "Sheikhupura", province: "Punjab", population: 473129 },
  { name: "Rahim Yar Khan", province: "Punjab", population: 420419 },
  { name: "Jhang", province: "Punjab", population: 414131 },
  { name: "Gujrat", province: "Punjab", population: 390533 },
  { name: "Sahiwal", province: "Punjab", population: 389605 },
  { name: "Wah Cantonment", province: "Punjab", population: 380103 },
  { name: "Dera Ghazi Khan", province: "Punjab", population: 399064 },
  { name: "Kasur", province: "Punjab", population: 358409 },
  { name: "Okara", province: "Punjab", population: 357935 },
  { name: "Burewala", province: "Punjab", population: 231797 },
  { name: "Kamoke", province: "Punjab", population: 249767 },
  { name: "Sadiqabad", province: "Punjab", population: 235695 },
  { name: "Khanewal", province: "Punjab", population: 227059 },
  { name: "Mandi Bahauddin", province: "Punjab", population: 198609 },
  { name: "Jhelum", province: "Punjab", population: 190425 },
  { name: "Attock", province: "Punjab", population: 146396 },
  { name: "Gojra", province: "Punjab", population: 174860 },
  { name: "Muridke", province: "Punjab", population: 163268 },
  { name: "Muzaffargarh", province: "Punjab", population: 163268 },
  { name: "Hafizabad", province: "Punjab", population: 157863 },
  { name: "Chishtian", province: "Punjab", population: 160000 },
  { name: "Jaranwala", province: "Punjab", population: 150000 },
  { name: "Eminabad", province: "Punjab", population: 150646, lat: "32.0414", lng: "74.2600", iso2: "PK" },
  { name: "Hasilpur", province: "Punjab", population: 135000 },
  { name: "Chakwal", province: "Punjab", population: 138146 },
  { name: "Pakpattan", province: "Punjab", population: 139525 },
  { name: "Vehari", province: "Punjab", population: 145456 },
  { name: "Samundri", province: "Punjab", population: 156000 },
  { name: "Kot Addu", province: "Punjab", population: 120479 },
  { name: "Kharian", province: "Punjab", population: 124051 },
  { name: "Wazirabad", province: "Punjab", population: 120000 },
  { name: "Khushab", province: "Punjab", population: 120000 },
  { name: "Chichawatni", province: "Punjab", population: 120000 },
  { name: "Toba Tek Singh", province: "Punjab", population: 109000 },
  { name: "Ahmedpur East", province: "Punjab", population: 125000 },
  { name: "Bhakkar", province: "Punjab", population: 112000 },
  { name: "Arifwala", province: "Punjab", population: 112000 },
  { name: "Lodhran", province: "Punjab", population: 117000 },
  { name: "Daska", province: "Punjab", population: 175000 },
  { name: "Ferozewala", province: "Punjab", population: 120000 },
  { name: "Layyah", province: "Punjab", population: 104000 },
  { name: "Kabirwala", province: "Punjab", population: 90000 },
  { name: "Jampur", province: "Punjab", population: 90000 },
  { name: "Nankana Sahib", province: "Punjab", population: 80000 },
  { name: "Bhalwal", province: "Punjab", population: 80000 },
  { name: "Dunyapur", province: "Punjab", population: 80000 },
  { name: "Taxila", province: "Punjab", population: 80000 },
  { name: "Haroonabad", province: "Punjab", population: 75000 },
  { name: "Pindi Bhattian", province: "Punjab", population: 75000 },
  { name: "Shahkot", province: "Punjab", population: 75000 },
  { name: "Shorkot", province: "Punjab", population: 85000 },
  { name: "Pasrur", province: "Punjab", population: 65000 },
  { name: "Kot Radha Kishan", province: "Punjab", population: 65000 },
  { name: "Sangla Hill", province: "Punjab", population: 65000 },
  { name: "Sillanwali", province: "Punjab", population: 55000 },
  { name: "Pir Mahal", province: "Punjab", population: 60000 },
  { name: "Bhawana", province: "Punjab", population: 60000 },
  { name: "Zafarwal", province: "Punjab", population: 60000 },
  { name: "Kot Momin", province: "Punjab", population: 50000 },
  { name: "Pindi Gheb", province: "Punjab", population: 45000 },
  { name: "Choa Saidanshah", province: "Punjab", population: 45000 },
  { name: "Jalalpur Bhattian", province: "Punjab", population: 40000 },
  { name: "Renala Khurd", province: "Punjab", population: 40000 },
  { name: "Narowal", province: "Punjab", population: 70000 },

  // ============================================
  // SINDH (All Major Cities & Districts)
  // ============================================
  { name: "Karachi", province: "Sindh", population: 15738000, capital: true, lat: "24.8600", lng: "67.0100", iso2: "PK" },
  { name: "Hyderabad", province: "Sindh", population: 1732693, lat: "25.3792", lng: "68.3683", iso2: "PK" },
  { name: "Sukkur", province: "Sindh", population: 499900 },
  { name: "Larkana", province: "Sindh", population: 490508 },
  { name: "Tando Allahyar", province: "Sindh", population: 156562 },
  { name: "Nawabshah", province: "Sindh", population: 279688 },
  { name: "Mirpur Khas", province: "Sindh", population: 233916 },
  { name: "Shikarpur", province: "Sindh", population: 199828 },
  { name: "Jacobabad", province: "Sindh", population: 191076 },
  { name: "Khairpur", province: "Sindh", population: 183181 },
  { name: "Dadu", province: "Sindh", population: 146179 },
  { name: "Tando Adam", province: "Sindh", population: 125598 },
  { name: "Shahdadpur", province: "Sindh", population: 90000 },
  { name: "Ghotki", province: "Sindh", population: 119384 },
  { name: "Kashmore", province: "Sindh", population: 120000 },
  { name: "Thatta", province: "Sindh", population: 136000 },
  { name: "Badin", province: "Sindh", population: 112419 },
  { name: "Umerkot", province: "Sindh", population: 106000 },
  { name: "Kandhkot", province: "Sindh", population: 105011 },
  { name: "Naushahro Feroze", province: "Sindh", population: 108505 },
  { name: "Matiari", province: "Sindh", population: 95793 },
  { name: "Pano Aqil", province: "Sindh", population: 120000 },
  { name: "Sanghar", province: "Sindh", population: 75565 },
  { name: "Shahdadkot", province: "Sindh", population: 90000 },
  { name: "Kambar", province: "Sindh", population: 80000 },
  { name: "Kotri", province: "Sindh", population: 80000 },
  { name: "Tando Muhammad Khan", province: "Sindh", population: 70000 },
  { name: "Moro", province: "Sindh", population: 70000 },
  { name: "Rohri", province: "Sindh", population: 70000 },
  { name: "Mithi", province: "Sindh", population: 60000 },
  { name: "Khipro", province: "Sindh", population: 60000 },
  { name: "Kunri", province: "Sindh", population: 55000 },
  { name: "Hala", province: "Sindh", population: 55000 },
  { name: "Ratodero", province: "Sindh", population: 75000 },
  { name: "Mehrabpur", province: "Sindh", population: 60000 },
  { name: "Digri", province: "Sindh", population: 45000 },
  { name: "Jhudo", province: "Sindh", population: 45000 },
  { name: "Sakrand", province: "Sindh", population: 45000 },
  { name: "Sehwan", province: "Sindh", population: 50000 },
  { name: "Nasirabad", province: "Sindh", population: 50000 },
  { name: "Mirwah Gorchani", province: "Sindh", population: 50000 },
  { name: "Garhi Yasin", province: "Sindh", population: 40000 },
  { name: "Dokri", province: "Sindh", population: 40000 },
  { name: "Madeji", province: "Sindh", population: 40000 },
  { name: "Kandiaro", province: "Sindh", population: 40000 },
  { name: "Gambat", province: "Sindh", population: 40000 },
  { name: "Tharu Shah", province: "Sindh", population: 40000 },
  { name: "Khadro", province: "Sindh", population: 35000 },
  { name: "Sinjhoro", province: "Sindh", population: 35000 },
  { name: "Sita Road", province: "Sindh", population: 35000 },
  { name: "Mithiani", province: "Sindh", population: 35000 },
  { name: "Ranipur", province: "Sindh", population: 35000 },
  { name: "Daulatpur", province: "Sindh", population: 30000 },
  { name: "Warah", province: "Sindh", population: 30000 },
  { name: "Rajo Khanani", province: "Sindh", population: 30000 },
  { name: "Karoondi", province: "Sindh", population: 30000 },
  { name: "Johi", province: "Sindh", population: 30000 },
  { name: "Thano Bula Khan", province: "Sindh", population: 25000 },
  { name: "Keti Bandar", province: "Sindh", population: 20000 },

  // ============================================
  // KHYBER PAKHTUNKHWA (All Major Cities & Districts)
  // ============================================
  { name: "Peshawar", province: "Khyber Pakhtunkhwa", population: 1970042, capital: true, lat: "34.0144", lng: "71.5675", iso2: "PK" },
  { name: "Mardan", province: "Khyber Pakhtunkhwa", population: 358604 },
  { name: "Mingora", province: "Khyber Pakhtunkhwa", population: 331091 },
  { name: "Kohat", province: "Khyber Pakhtunkhwa", population: 228779 },
  { name: "Dera Ismail Khan", province: "Khyber Pakhtunkhwa", population: 217457 },
  { name: "Abbottabad", province: "Khyber Pakhtunkhwa", population: 148587 },
  { name: "Mansehra", province: "Khyber Pakhtunkhwa", population: 127623 },
  { name: "Swabi", province: "Khyber Pakhtunkhwa", population: 123412 },
  { name: "Nowshera", province: "Khyber Pakhtunkhwa", population: 120131 },
  { name: "Charsadda", province: "Khyber Pakhtunkhwa", population: 105414 },
  { name: "Swat", province: "Khyber Pakhtunkhwa", population: 258000 },
  { name: "Haripur", province: "Khyber Pakhtunkhwa", population: 124000 },
  { name: "Bannu", province: "Khyber Pakhtunkhwa", population: 49021 },
  { name: "Jamrud", province: "Khyber Pakhtunkhwa", population: 150000 },
  { name: "Batkhela", province: "Khyber Pakhtunkhwa", population: 65422 },
  { name: "Hangu", province: "Khyber Pakhtunkhwa", population: 53000 },
  { name: "Tank", province: "Khyber Pakhtunkhwa", population: 44220 },
  { name: "Lakki Marwat", province: "Khyber Pakhtunkhwa", population: 50000 },
  { name: "Karak", province: "Khyber Pakhtunkhwa", population: 70000 },
  { name: "Timergara", province: "Khyber Pakhtunkhwa", population: 45000 },
  { name: "Chitral", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "Dir", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "Shabqadar", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "Parachinar", province: "Khyber Pakhtunkhwa", population: 60000 },
  { name: "Landi Kotal", province: "Khyber Pakhtunkhwa", population: 45000 },
  { name: "Takht-i-Bahi", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Daggar", province: "Khyber Pakhtunkhwa", population: 25000 },
  { name: "Risalpur", province: "Khyber Pakhtunkhwa", population: 50000 },
  { name: "Baffa", province: "Khyber Pakhtunkhwa", population: 20000 },
  { name: "Tordher", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Zaida", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "Pabbi", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "Amangarh", province: "Khyber Pakhtunkhwa", population: 45000 },
  { name: "Ghari Kapura", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "Cherat", province: "Khyber Pakhtunkhwa", population: 20000 },
  { name: "Khwazakhela", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Matta", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "Kabal", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "Barikot", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Utmanzai", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "Prang", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "Munda", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Shewa Adda", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Topi", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "Banda Daud Shah", province: "Khyber Pakhtunkhwa", population: 25000 },
  { name: "Kulachi", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "Sarai Naurang", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "Paniala", province: "Khyber Pakhtunkhwa", population: 20000 },
  { name: "Khpal Kor", province: "Khyber Pakhtunkhwa", population: 25000 },
  { name: "Madyan", province: "Khyber Pakhtunkhwa", population: 20000 },
  { name: "Bahrain", province: "Khyber Pakhtunkhwa", population: 15000 },
  { name: "Kalam", province: "Khyber Pakhtunkhwa", population: 12000 },
  { name: "Gomal", province: "Khyber Pakhtunkhwa", population: 15000 },
  { name: "Bajaur", province: "Khyber Pakhtunkhwa", population: 120000 },
  { name: "Khyber", province: "Khyber Pakhtunkhwa", population: 150000 },
  { name: "Mohmand", province: "Khyber Pakhtunkhwa", population: 80000 },
  { name: "Kurram", province: "Khyber Pakhtunkhwa", population: 90000 },
  { name: "Orakzai", province: "Khyber Pakhtunkhwa", population: 60000 },
  { name: "North Waziristan", province: "Khyber Pakhtunkhwa", population: 70000 },
  { name: "South Waziristan", province: "Khyber Pakhtunkhwa", population: 80000 },
  { name: "FR Peshawar", province: "Khyber Pakhtunkhwa", population: 50000 },
  { name: "FR Dera Ismail Khan", province: "Khyber Pakhtunkhwa", population: 45000 },
  { name: "FR Kohat", province: "Khyber Pakhtunkhwa", population: 40000 },
  { name: "FR Bannu", province: "Khyber Pakhtunkhwa", population: 35000 },
  { name: "FR Lakki Marwat", province: "Khyber Pakhtunkhwa", population: 30000 },
  { name: "FR Tank", province: "Khyber Pakhtunkhwa", population: 25000 },

  // ============================================
  // BALOCHISTAN (All Major Cities & Districts)
  // ============================================
  { name: "Quetta", province: "Balochistan", population: 1001205, capital: true, lat: "30.1833", lng: "67.0000", iso2: "PK" },
  { name: "Turbat", province: "Balochistan", population: 213557 },
  { name: "Khuzdar", province: "Balochistan", population: 182927 },
  { name: "Hub", province: "Balochistan", population: 175376 },
  { name: "Chaman", province: "Balochistan", population: 123191 },
  { name: "Gwadar", province: "Balochistan", population: 90622 },
  { name: "Dera Allah Yar", province: "Balochistan", population: 80000 },
  { name: "Usta Muhammad", province: "Balochistan", population: 77217 },
  { name: "Sui", province: "Balochistan", population: 70000 },
  { name: "Sibi", province: "Balochistan", population: 64991 },
  { name: "Kech", province: "Balochistan", population: 150000 },
  { name: "Jaffarabad", province: "Balochistan", population: 90000 },
  { name: "Loralai", province: "Balochistan", population: 45600 },
  { name: "Zhob", province: "Balochistan", population: 55300 },
  { name: "Pasni", province: "Balochistan", population: 33673 },
  { name: "Nushki", province: "Balochistan", population: 35600 },
  { name: "Mastung", province: "Balochistan", population: 29800 },
  { name: "Kalat", province: "Balochistan", population: 28000 },
  { name: "Kharan", province: "Balochistan", population: 35000 },
  { name: "Panjgur", province: "Balochistan", population: 30000 },
  { name: "Uthal", province: "Balochistan", population: 40000 },
  { name: "Bela", province: "Balochistan", population: 30000 },
  { name: "Sohbatpur", province: "Balochistan", population: 35000 },
  { name: "Nasirabad", province: "Balochistan", population: 75000 },
  { name: "Awaran", province: "Balochistan", population: 25000 },
  { name: "Barkhan", province: "Balochistan", population: 20000 },
  { name: "Musakhel", province: "Balochistan", population: 18000 },
  { name: "Killa Saifullah", province: "Balochistan", population: 32000 },
  { name: "Dera Bugti", province: "Balochistan", population: 25000 },
  { name: "Kohlu", province: "Balochistan", population: 20000 },
  { name: "Jiwani", province: "Balochistan", population: 25000 },
  { name: "Ormara", province: "Balochistan", population: 20000 },
  { name: "Duki", province: "Balochistan", population: 25000 },
  { name: "Chagai", province: "Balochistan", population: 15000 },
  { name: "Washuk", province: "Balochistan", population: 12000 },
  { name: "Harnai", province: "Balochistan", population: 15000 },
  { name: "Ziarat", province: "Balochistan", population: 12000 },
  { name: "Sherani", province: "Balochistan", population: 10000 },
  { name: "Gadani", province: "Balochistan", population: 15000 },
  { name: "Lehri", province: "Balochistan", population: 8000 },
  { name: "Mund", province: "Balochistan", population: 12000 },
  { name: "Gishkore", province: "Balochistan", population: 10000 },
  { name: "Suntsar", province: "Balochistan", population: 8000 },
  { name: "Mashkay", province: "Balochistan", population: 7000 },
  { name: "Shahrak", province: "Balochistan", population: 6000 },
  { name: "Gokdan", province: "Balochistan", population: 5000 },
  { name: "Nal", province: "Balochistan", population: 4000 },
  { name: "Saranan", province: "Balochistan", population: 4000 },
  { name: "Koh-i-Sultan", province: "Balochistan", population: 5000 },
  { name: "Kan Mehtarzai", province: "Balochistan", population: 3000 },

  // ============================================
  // GILGIT-BALTISTAN (All Major Cities & Districts)
  // ============================================
  { name: "Gilgit", province: "Gilgit-Baltistan", population: 88500, capital: true, lat: "35.9214", lng: "74.3083", iso2: "PK" },
  { name: "Skardu", province: "Gilgit-Baltistan", population: 42800, lat: "35.2971", lng: "75.6331", iso2: "PK" },
  { name: "Hunza", province: "Gilgit-Baltistan", population: 15000, lat: "36.3167", lng: "74.6500", iso2: "PK" },
  { name: "Karimabad", province: "Gilgit-Baltistan", population: 8000, lat: "36.3250", lng: "74.6750", iso2: "PK" },
  { name: "Chilas", province: "Gilgit-Baltistan", population: 21400 },
  { name: "Ghizer", province: "Gilgit-Baltistan", population: 19000 },
  { name: "Astore", province: "Gilgit-Baltistan", population: 12700 },
  { name: "Nagar", province: "Gilgit-Baltistan", population: 12000 },
  { name: "Shigar", province: "Gilgit-Baltistan", population: 9500 },
  { name: "Khaplu", province: "Gilgit-Baltistan", population: 11200 },
  { name: "Ghanche", province: "Gilgit-Baltistan", population: 10000 },
  { name: "Kharmang", province: "Gilgit-Baltistan", population: 9000 },
  { name: "Roundu", province: "Gilgit-Baltistan", population: 8000 },
  { name: "Diamer", province: "Gilgit-Baltistan", population: 11000 },
  { name: "Gupis", province: "Gilgit-Baltistan", population: 7000 },
  { name: "Yasin", province: "Gilgit-Baltistan", population: 6000 },
  { name: "Ishkoman", province: "Gilgit-Baltistan", population: 5000 },
  { name: "Aliabad", province: "Gilgit-Baltistan", population: 5000 },
  { name: "Punial", province: "Gilgit-Baltistan", population: 4000 },
  { name: "Gojal", province: "Gilgit-Baltistan", population: 3000 },
  { name: "Minapin", province: "Gilgit-Baltistan", population: 3000 },
  { name: "Naltar", province: "Gilgit-Baltistan", population: 2000 },
  { name: "Phander", province: "Gilgit-Baltistan", population: 1500 },
  { name: "Sost", province: "Gilgit-Baltistan", population: 2000 },
  { name: "Misgar", province: "Gilgit-Baltistan", population: 1000 },
  { name: "Hopar", province: "Gilgit-Baltistan", population: 1500 },
  { name: "Askole", province: "Gilgit-Baltistan", population: 1000 },
  { name: "Alingar", province: "Gilgit-Baltistan", population: 800 },
  { name: "Tolti", province: "Gilgit-Baltistan", population: 600 },
  { name: "Khaibar", province: "Gilgit-Baltistan", population: 400 },

  // ============================================
  // AZAD JAMMU & KASHMIR (All Major Cities & Districts)
  // ============================================
  { name: "Muzaffarabad", province: "Azad Jammu & Kashmir", population: 149000, capital: true, lat: "34.3700", lng: "73.4711", iso2: "PK" },
  { name: "Mirpur", province: "Azad Jammu & Kashmir", population: 124000, lat: "33.1500", lng: "73.7500", iso2: "PK" },
  { name: "Kotli", province: "Azad Jammu & Kashmir", population: 64000, lat: "33.5167", lng: "73.9000", iso2: "PK" },
  { name: "Rawalakot", province: "Azad Jammu & Kashmir", population: 21000, lat: "33.8500", lng: "73.7500", iso2: "PK" },
  { name: "Neelum Valley", province: "Azad Jammu & Kashmir", population: 191000 },
  { name: "Bhimber", province: "Azad Jammu & Kashmir", population: 46000 },
  { name: "Bagh", province: "Azad Jammu & Kashmir", population: 45000 },
  { name: "Sudhanoti", province: "Azad Jammu & Kashmir", population: 31000 },
  { name: "Poonch", province: "Azad Jammu & Kashmir", population: 35000 },
  { name: "Hattian", province: "Azad Jammu & Kashmir", population: 25000 },
  { name: "Haveli", province: "Azad Jammu & Kashmir", population: 18000 },
  { name: "Sehnsa", province: "Azad Jammu & Kashmir", population: 7000 },
  { name: "Abbaspur", province: "Azad Jammu & Kashmir", population: 15000 },
  { name: "Forward Kahuta", province: "Azad Jammu & Kashmir", population: 12000 },
  { name: "Pallandri", province: "Azad Jammu & Kashmir", population: 14000 },
  { name: "Tatrinote", province: "Azad Jammu & Kashmir", population: 5000 },
  { name: "Thorar", province: "Azad Jammu & Kashmir", population: 10000 },
  { name: "Chikar", province: "Azad Jammu & Kashmir", population: 8000 },
  { name: "Baral", province: "Azad Jammu & Kashmir", population: 4000 },
  { name: "Charhoi", province: "Azad Jammu & Kashmir", population: 6000 },
  { name: "Khai Gala", province: "Azad Jammu & Kashmir", population: 5000 },
  { name: "Saran", province: "Azad Jammu & Kashmir", population: 4000 },
  { name: "Chaffar", province: "Azad Jammu & Kashmir", population: 3000 },
  { name: "Chowki", province: "Azad Jammu & Kashmir", population: 3000 },
  { name: "Mong", province: "Azad Jammu & Kashmir", population: 2000 },
  { name: "Dhakki", province: "Azad Jammu & Kashmir", population: 2000 },
  { name: "Bari", province: "Azad Jammu & Kashmir", population: 1500 },
  { name: "Bali Na Mohra", province: "Azad Jammu & Kashmir", population: 1000 },
  { name: "Pandu", province: "Azad Jammu & Kashmir", population: 800 },
  { name: "Mehndar", province: "Azad Jammu & Kashmir", population: 600 },

  // ============================================
  // ISLAMABAD CAPITAL TERRITORY
  // ============================================
  { name: "Islamabad", province: "Islamabad Capital Territory", population: 1014825, capital: true, lat: "33.6931", lng: "73.0639", iso2: "PK" },
];

/** Map province aliases to standard keys */
export function normalizeProvince(p?: string): string {
  if (!p) return "all";
  const lower = p.toLowerCase().trim();
  if (lower.includes("kpk") || lower.includes("khyber")) return "Khyber Pakhtunkhwa";
  if (lower.includes("punjab")) return "Punjab";
  if (lower.includes("sindh")) return "Sindh";
  if (lower.includes("balochistan")) return "Balochistan";
  if (lower.includes("islamabad") || lower.includes("ict")) return "Islamabad Capital Territory";
  if (lower.includes("gilgit") || lower.includes("baltistan")) return "Gilgit-Baltistan";
  if (lower.includes("ajk") || lower.includes("kashmir")) return "Azad Jammu & Kashmir";
  return p;
}

/** Get list of cities for a given province */
export function getCitiesByProvince(province?: string): string[] {
  if (!province || province === "all") {
    return Array.from(new Set(CITIES_DATA.map((c) => c.name))).sort();
  }
  const norm = normalizeProvince(province);
  const filtered = CITIES_DATA.filter((c) => c.province.toLowerCase() === norm.toLowerCase()).map((c) => c.name);
  return Array.from(new Set(filtered)).sort();
}

/** Lookup province for a city name */
export function getProvinceForCity(cityName?: string): string {
  if (!cityName) return "";
  const found = CITIES_DATA.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
  return found ? found.province : "";
}

/** Check if item matches selected province (checking explicit province or resolving via city) */
export function matchesProvince(selectedProvince: string, itemProvince?: string, itemCity?: string): boolean {
  if (!selectedProvince || selectedProvince === "all") return true;
  
  const selNorm = normalizeProvince(selectedProvince).toLowerCase();
  
  if (itemProvince) {
    const itemNorm = normalizeProvince(itemProvince).toLowerCase();
    if (itemNorm.includes(selNorm) || selNorm.includes(itemNorm)) return true;
  }
  
  if (itemCity) {
    const resolvedProv = getProvinceForCity(itemCity);
    if (resolvedProv) {
      const resolvedNorm = normalizeProvince(resolvedProv).toLowerCase();
      if (resolvedNorm.includes(selNorm) || selNorm.includes(resolvedNorm)) return true;
    }
  }

  return false;
}
