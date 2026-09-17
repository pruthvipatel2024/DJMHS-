export type Language = 'en' | 'gu' | 'hi';

export interface Translations {
  nav: {
    brandName: string;
    brandSub: string;
    about: string;
    academics: string;
    campusLife: string;
    activities: string;
    achievements: string;
    gallery: string;
    newsEvents: string;
    contact: string;
    enquireNow: string;
  };
  hero: {
    tag: string;
    title: string;
    subtitle: string;
    discoverBtn: string;
    getInTouchBtn: string;
    scrollExplore: string;
  };
  intro: {
    tag: string;
    title: string;
    desc: string;
    discoverStoryBtn: string;
    values: { num: string; title: string }[];
  };
  about: {
    tag: string;
    title: string;
    subtitle: string;
    pillars: {
      num: string;
      title: string;
      desc: string;
      image: string;
    }[];
  };
  academics: {
    tag: string;
    title: string;
    cards: {
      num: string;
      title: string;
      desc: string;
    }[];
  };
  campus: {
    tag: string;
    title: string;
    subtitle: string;
    badge1: string;
    badge2: string;
    badge3: string;
  };
  activities: {
    tag: string;
    title: string;
    items: {
      num: string;
      title: string;
      desc: string;
    }[];
  };
  achievements: {
    tag: string;
    title: string;
    boxTitle: string;
    boxDesc: string;
    stats: { value: string; label: string }[];
  };
  news: {
    tag: string;
    title: string;
    viewAll: string;
    items: {
      date: string;
      category: string;
      title: string;
      desc: string;
    }[];
  };
  gallery: {
    tag: string;
    title: string;
    filters: { id: string; label: string }[];
  };
  sharedJourney: {
    tag: string;
    title: string;
    desc: string;
    connectBtn: string;
    followTag: string;
    handle: string;
    followLink: string;
  };
  contact: {
    tag: string;
    title: string;
    desc: string;
    addressLabel: string;
    addressVal: string;
    phoneLabel: string;
    phoneVal: string;
    emailLabel: string;
    emailVal: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submitBtn: string;
      sendingBtn: string;
      successMsg: string;
      errorMsg: string;
    };
  };
  footer: {
    schoolDesc: string;
    exploreTitle: string;
    contactTitle: string;
    portalBtn: string;
    copyright: string;
    locationBadge: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      brandName: 'Shree Dhaneshkumar',
      brandSub: 'JASVANTLAL MAHETA HIGH SCHOOL',
      about: 'ABOUT',
      academics: 'ACADEMICS',
      campusLife: 'CAMPUS LIFE',
      activities: 'ACTIVITIES',
      achievements: 'ACHIEVEMENTS',
      gallery: 'GALLERY',
      newsEvents: 'NEWS & EVENTS',
      contact: 'CONTACT',
      enquireNow: 'ENQUIRE NOW',
    },
    hero: {
      tag: '— A SCHOOL FOR THE JOURNEY AHEAD',
      title: 'Learning Today. Building Tomorrow.',
      subtitle: 'An open, purposeful place where learning, character, discipline, and curiosity come together — with every student\'s next step in view.',
      discoverBtn: 'DISCOVER OUR SCHOOL',
      getInTouchBtn: 'GET IN TOUCH',
      scrollExplore: 'SCROLL TO EXPLORE',
    },
    intro: {
      tag: '— OUR INTRODUCTION',
      title: 'More Than a School. A Place to Grow.',
      desc: 'At Shree Dhaneshkumar Jasvantlal Maheta High School, the school experience is understood as a shared journey: students learning with purpose, teachers guiding with care, and a community growing together. Established in 1959 under Bhavnagar Kelavani Mandal.',
      discoverStoryBtn: 'DISCOVER OUR STORY',
      values: [
        { num: '01', title: 'Learning' },
        { num: '02', title: 'Character' },
        { num: '03', title: 'Discipline' },
        { num: '04', title: 'Responsibility' },
        { num: '05', title: 'Curiosity' },
        { num: '06', title: 'Community' },
      ],
    },
    about: {
      tag: '— ABOUT THE SCHOOL',
      title: 'An institution shaped by everyday learning.',
      subtitle: 'This profile is intentionally ready for the school\'s verified story, vision, mission, and values, nurturing generations with wisdom and integrity.',
      pillars: [
        {
          num: '01',
          title: 'Our Story',
          desc: 'Founded in 1959, our school has stood as a pillar of quality education in Bhavnagar, shaping leaders, scholars, and responsible citizens for over 65 years.',
          image: '/images/school_photo_1.jpg',
        },
        {
          num: '02',
          title: 'Our Vision',
          desc: 'To cultivate a learning community where curiosity inspires innovation, character builds resilience, and every student is equipped to thrive in a dynamic world.',
          image: '/images/school_photo_2.jpg',
        },
        {
          num: '03',
          title: 'Our Mission',
          desc: 'To provide comprehensive, accessible, and value-driven education that fosters intellectual rigor, moral integrity, and social responsibility.',
          image: '/images/school_photo_3.jpg',
        },
        {
          num: '04',
          title: 'Our Values',
          desc: 'Learning, character, discipline, responsibility, curiosity, and community form the moral bedrock of our educational philosophy.',
          image: '/images/school_photo_4.jpg',
        },
      ],
    },
    academics: {
      tag: '— ACADEMICS',
      title: 'A thoughtful environment for learning.',
      cards: [
        {
          num: '01',
          title: 'Standards / Classes',
          desc: 'Secondary and Higher Secondary education (Grades 9 to 12) adhering to the Gujarat Secondary and Higher Secondary Education Board (GSEB) curriculum, specializing in General and Commerce streams.',
        },
        {
          num: '02',
          title: 'Subjects & Curriculum',
          desc: 'Rigorous academic subjects including Mathematics, Science & Technology, Elements of Accounts, Statistics, Economics, Business Administration, English, Gujarati, Hindi, and Computer Studies.',
        },
        {
          num: '03',
          title: 'Learning Environment',
          desc: 'Spacious, well-ventilated classrooms, modernized science and computer laboratories, and interactive multimedia learning resources designed for deep academic engagement.',
        },
        {
          num: '04',
          title: 'Student Development',
          desc: 'Dedicated mentorship, career counseling, remedial academic support, and comprehensive evaluation programs ensuring every student reaches their highest potential.',
        },
      ],
    },
    campus: {
      tag: '— CAMPUS LIFE',
      title: 'Life across the school day.',
      subtitle: 'A visual celebration of the places, people, and moments that make a school day feel lived in and inspiring.',
      badge1: 'CAMPUS / FACADE',
      badge2: 'LIBRARY / KNOWLEDGE HUB',
      badge3: 'LEARNING / SCIENCE LABS',
    },
    activities: {
      tag: '— ACTIVITIES & STUDENT LIFE',
      title: 'Learning does not end at the classroom door.',
      items: [
        {
          num: '01',
          title: 'Sports & Physical Education',
          desc: 'Athletics, cricket, volleyball, kabaddi, yoga, and annual sports tournaments encouraging teamwork, physical vitality, and sportsmanship.',
        },
        {
          num: '02',
          title: 'Cultural Programmes & Arts',
          desc: 'Annual school day celebrations, traditional folk dances (Garba), theatrical plays, musical performances, and festive cultural gatherings.',
        },
        {
          num: '03',
          title: 'Competitions & Debates',
          desc: 'Inter-school elocution, science exhibitions, math quizzes, drawing competitions, and Olympiads inspiring critical inquiry and creative expression.',
        },
        {
          num: '04',
          title: 'Community & Social Initiatives',
          desc: 'Tree plantation drives, cleanliness campaigns (Swachh Bharat), blood donation camps, and youth leadership initiatives connecting students with society.',
        },
      ],
    },
    achievements: {
      tag: '— ACHIEVEMENTS',
      title: 'A record of moments worth sharing.',
      boxTitle: 'Academic Excellence & Milestones',
      boxDesc: 'Student achievements, 100% board examination pass records, state-level sports accolades, and cultural recognitions reflecting our proud heritage.',
      stats: [
        { value: '65+', label: 'Years of Legacy' },
        { value: '100%', label: 'Board Exam Success' },
        { value: '25+', label: 'State & District Awards' },
        { value: '15,000+', label: 'Proud Alumni' },
      ],
    },
    news: {
      tag: '— NEWS & EVENTS',
      title: 'The latest from school life.',
      viewAll: 'VIEW ALL UPDATES',
      items: [
        {
          date: 'September 15, 2026',
          category: 'ADMISSIONS',
          title: 'Admissions Open for Academic Year 2026-2027',
          desc: 'Applications are invited for Standards 9, 10, 11, and 12 Commerce. Contact the administrative office for prospectus and registration.',
        },
        {
          date: 'September 05, 2026',
          category: 'CELEBRATION',
          title: 'Teacher\'s Day Celebration & Student Honors',
          desc: 'Honoring our dedicated educators with special cultural presentations and recognizing student leadership across high school standards.',
        },
        {
          date: 'August 15, 2026',
          category: 'PATRIOTIC',
          title: '79th Independence Day Flag Hoisting & Parade',
          desc: 'Ceremonial flag hoisting, patriotic parade by scouts, and student speeches commemorating our nation\'s heritage.',
        },
      ],
    },
    gallery: {
      tag: '— PHOTO GALLERY',
      title: 'Scenes of a school day.',
      filters: [
        { id: 'ALL', label: 'ALL' },
        { id: 'CAMPUS', label: 'CAMPUS' },
        { id: 'ACADEMICS', label: 'ACADEMICS' },
        { id: 'SPORTS', label: 'SPORTS' },
        { id: 'CULTURAL', label: 'CULTURAL' },
      ],
    },
    sharedJourney: {
      tag: '— A SHARED JOURNEY',
      title: 'A School Is More Than a Place to Learn.',
      desc: 'Students, parents, teachers, alumni, and the wider community each have a part in the life of a school. This space holds the school\'s own community story as it unfolds.',
      connectBtn: 'CONNECT WITH THE SCHOOL',
      followTag: '— FOLLOW THE JOURNEY',
      handle: '@shreedjmahetahighschool',
      followLink: 'FOLLOW OUR JOURNEY',
    },
    contact: {
      tag: '— CONTACT THE SCHOOL',
      title: 'Let\'s begin a conversation.',
      desc: 'For admissions, school visits, or general information, send a note. Verified contact details and administrative support are available during school hours.',
      addressLabel: 'ADDRESS',
      addressVal: 'Plot no. 50, Near Subhashnagar, Bhavnagar, Gujarat - 364001',
      phoneLabel: 'PHONE',
      phoneVal: '+91 278 242 4550 / +91 84949 46842',
      emailLabel: 'EMAIL',
      emailVal: 'contact@sdjmt.edu.in / info@sdjmt.edu.in',
      form: {
        nameLabel: 'NAME',
        namePlaceholder: 'Your full name',
        emailLabel: 'EMAIL',
        emailPlaceholder: 'you@example.com',
        phoneLabel: 'PHONE',
        phonePlaceholder: 'Your phone number',
        messageLabel: 'MESSAGE',
        messagePlaceholder: 'How can the school help you?',
        submitBtn: 'SEND ENQUIRY',
        sendingBtn: 'SENDING...',
        successMsg: 'Thank you! Your enquiry has been sent to the school administration office.',
        errorMsg: 'Unable to send enquiry right now. Please try again or call us directly.',
      },
    },
    footer: {
      schoolDesc: 'A public school identity website for Shree Dhaneshkumar Jasvantlal Maheta High School, Bhavnagar, Gujarat. Managed under Bhavnagar Kelavani Mandal (Est. 1959).',
      exploreTitle: 'EXPLORE',
      contactTitle: 'CONTACT',
      portalBtn: 'Login to ERP Software Portal',
      copyright: '© 2026 SHREE DHANESHKUMAR JASVANTLAL MAHETA HIGH SCHOOL. ALL RIGHTS RESERVED.',
      locationBadge: 'BHAVNAGAR, GUJARAT',
    },
  },

  gu: {
    nav: {
      brandName: 'શ્રી ધનેશકુમાર',
      brandSub: 'જસવંતલાલ મહેતા હાઇસ્કૂલ',
      about: 'અમારા વિશે',
      academics: 'શૈક્ષણિક',
      campusLife: 'કેમ્પસ જીવન',
      activities: 'પ્રવૃત્તિઓ',
      achievements: 'સિદ્ધિઓ',
      gallery: 'ગેલેરી',
      newsEvents: 'સમાચાર અને ઘટનાઓ',
      contact: 'સંપર્ક',
      enquireNow: 'પૂછપરછ કરો',
    },
    hero: {
      tag: '— આગળની સફર માટેની શાળા',
      title: 'આજે શીખીએ. આવતીકાલ બનાવીએ.',
      subtitle: 'જ્યાં શિક્ષણ, ચારિત્ર્ય, શિસ્ત અને જિજ્ઞાસા સાથે મળીને દરેક વિદ્યાર્થીના વિકાસને દિશા આપે છે.',
      discoverBtn: 'અમારી શાળા જાણો',
      getInTouchBtn: 'સંપર્ક કરો',
      scrollExplore: 'વધુ જોવા માટે નીચે સ્ક્રોલ કરો',
    },
    intro: {
      tag: '— અમારો પરિચય',
      title: 'માત્ર એક શાળા નહીં. વિકાસનું સ્થાન.',
      desc: 'શ્રી ધનેશકુમાર જસવંતલાલ મહેતા હાઇસ્કૂલમાં શિક્ષણ એક સહિયારી યાત્રા છે: ઉદ્દેશ્ય સાથે શીખતા વિદ્યાર્થીઓ, કાળજીપૂર્વક માર્ગદર્શન આપતા શિક્ષકો અને એક સાથે વિકાસ પામતો સમુદાય. ભાવનગર કેળવણી મંડળ હેઠળ ૧૯૫૯ થી કાર્યરત.',
      discoverStoryBtn: 'અમારો ઇતિહાસ જાણો',
      values: [
        { num: '01', title: 'શિક્ષણ' },
        { num: '02', title: 'ચારિત્ર્ય' },
        { num: '03', title: 'શિસ્ત' },
        { num: '04', title: 'જવાબદારી' },
        { num: '05', title: 'જિજ્ઞાસા' },
        { num: '06', title: 'સમુદાય' },
      ],
    },
    about: {
      tag: '— શાળા વિશે',
      title: 'રોજિંદા શિક્ષણ દ્વારા ઘડાયેલી સંસ્થા.',
      subtitle: 'આ સંસ્થા વિદ્યાર્થીઓના સર્વાંગી વિકાસ, નૈતિક મૂલ્યો, ચારિત્ર્ય નિર્માણ અને ગુણવત્તાયુક્ત શિક્ષણ માટે સમર્પિત છે.',
      pillars: [
        {
          num: '01',
          title: 'અમારો ઇતિહાસ',
          desc: '૧૯૫૯ માં સ્થપાયેલી અમારી શાળા ૬૫ વર્ષથી વધુ સમયથી ભાવનગરમાં શિક્ષણ ક્ષેત્રે અગ્રેસર રહીને અનેક સફળ નાગરિકોનું ઘડતર કરી રહી છે.',
          image: '/images/school_photo_1.jpg',
        },
        {
          num: '02',
          title: 'અમારું વિઝન',
          desc: 'એવા શિક્ષણ સમુદાયનું નિર્માણ કરવું જ્યાં જિજ્ઞાસા નવીનતાને પ્રેરણા આપે અને દરેક વિદ્યાર્થી ભવિષ્યના પડકારો માટે સજ્જ બને.',
          image: '/images/school_photo_2.jpg',
        },
        {
          num: '03',
          title: 'અમારું મિશન',
          desc: 'દરેક વિદ્યાર્થીને સમાન, આધુનિક અને મૂલ્યનિષ્ઠ શિક્ષણ પૂરું પાડવું જેથી તેઓ બૌદ્ધિક અને નૈતિક રીતે સમૃદ્ધ બને.',
          image: '/images/school_photo_3.jpg',
        },
        {
          num: '04',
          title: 'અમારા મૂલ્યો',
          desc: 'શિસ્ત, પ્રામાણિકતા, આદર, પરિશ્રમ અને સેવાભાવ એ અમારા શૈક્ષણિક તત્વજ્ઞાનનો પાયો છે.',
          image: '/images/school_photo_4.jpg',
        },
      ],
    },
    academics: {
      tag: '— શૈક્ષણિક બાબતો',
      title: 'શિક્ષણ માટેનું વિચારશીલ વાતાવરણ.',
      cards: [
        {
          num: '01',
          title: 'ધોરણ અને વર્ગો',
          desc: 'ગુજરાત માધ્યમિક અને ઉચ્ચતર માધ્યમિક શિક્ષણ બોર્ડ (GSEB) માન્ય ધોરણ ૯ થી ૧૨ (સામાન્ય અને વાણિજ્ય પ્રવાહ) નું શ્રેષ્ઠ શિક્ષણ.',
        },
        {
          num: '02',
          title: 'અભ્યાસક્રમ અને વિષયો',
          desc: 'ગણિત, વિજ્ઞાન અને ટેકનોલોજી, નામાના મૂળતત્વો, આંકડાશાસ્ત્ર, અર્થશાસ્ત્ર, વાણિજ્ય વ્યવસ્થા, ભાષાઓ અને કમ્પ્યુટર શિક્ષણ.',
        },
        {
          num: '03',
          title: 'શૈક્ષણિક સુવિધાઓ',
          desc: 'હવાદાર વર્ગખંડો, આધુનિક વિજ્ઞાન અને કમ્પ્યુટર પ્રયોગશાળાઓ, પુસ્તકાલય અને ઇન્ટરેક્ટિવ લર્નિંગ સાધનો.',
        },
        {
          num: '04',
          title: 'વિદ્યાર્થી વિકાસ',
          desc: 'વ્યક્તિગત માર્ગદર્શન, કારકિર્દી કાઉન્સેલિંગ, પૂરક શિક્ષણ અને સર્વાંગી પ્રગતિ માટે નિયમિત મૂલ્યાંકન પદ્ધતિ.',
        },
      ],
    },
    campus: {
      tag: '— કેમ્પસ જીવન',
      title: 'શાળાના દિવસોનો વાઇબ્રન્ટ માહોલ.',
      subtitle: 'શાળા જીવનને પ્રેરણાદાયી અને યાદગાર બનાવતી ક્ષણો અને સ્થળોની એક ઝલક.',
      badge1: 'કેમ્પસ / મુખ્ય ઇમારત',
      badge2: 'પુસ્તકાલય / જ્ઞાન કેન્દ્ર',
      badge3: 'શિક્ષણ / પ્રયોગશાળાઓ',
    },
    activities: {
      tag: '— પ્રવૃત્તિઓ અને વિદ્યાર્થી જીવન',
      title: 'શિક્ષણ વર્ગખંડ પૂરતું સીમિત નથી.',
      items: [
        {
          num: '01',
          title: 'રમતગમત અને શારીરિક શિક્ષણ',
          desc: 'એથ્લેટિક્સ, ક્રિકેટ, વોલીબોલ, કબડ્ડી, યોગાસન અને વાર્ષિક રમત મહોત્સવ દ્વારા ટીમ ભાવના અને સ્વાસ્થ્યનો વિકાસ.',
        },
        {
          num: '02',
          title: 'સાંસ્કૃતિક કાર્યક્રમો',
          desc: 'વાર્ષિક ઉત્સવ, રાસ-ગરબા, નાટક, સંગીત અને પરંપરાગત તહેવારોની હર્ષોલ્લાસ સાથે ઉજવણી.',
        },
        {
          num: '03',
          title: 'સ્પર્ધાઓ અને વક્તૃત્વ',
          desc: 'વક્તૃત્વ સ્પર્ધા, વિજ્ઞાન મેળો, ગણિત ક્વિઝ, ચિત્રકામ અને નિબંધ સ્પર્ધાઓ દ્વારા પ્રતિભા નિખાર.',
        },
        {
          num: '04',
          title: 'સામાજિક અને સેવા પ્રવૃત્તિઓ',
          desc: 'વૃક્ષારોપણ, સ્વચ્છતા અભિયાન, પર્યાવરણ જાગૃતિ અને સમાજ સેવા પ્રોજેક્ટ્સ.',
        },
      ],
    },
    achievements: {
      tag: '— સિદ્ધિઓ',
      title: 'ગર્વ લેવા જેવી ગૌરવપૂર્ણ ક્ષણો.',
      boxTitle: 'શૈક્ષણિક શ્રેષ્ઠતા અને સિદ્ધિઓ',
      boxDesc: 'બોર્ડ પરીક્ષાઓમાં ઉત્કૃષ્ટ પરિણામો, રમતગમત અને સાંસ્કૃતિક સ્પર્ધાઓમાં વિજેતા ટ્રોફીઓ.',
      stats: [
        { value: '૬૫+', label: 'વર્ષોનો ભવ્ય વારસો' },
        { value: '૧૦૦%', label: 'બોર્ડ પરીક્ષા પરિણામ' },
        { value: '૨૫+', label: 'રાજ્ય અને જિલ્લા પુરસ્કાર' },
        { value: '૧૫,૦૦૦+', label: 'ગૌરવશાળી ભૂતપૂર્વ વિદ્યાર્થીઓ' },
      ],
    },
    news: {
      tag: '— સમાચાર અને ઘટનાઓ',
      title: 'શાળાના તાજા સમાચારો.',
      viewAll: 'બધા અપડેટ્સ જુઓ',
      items: [
        {
          date: '૧૫ સપ્ટેમ્બર, ૨૦૨૬',
          category: 'પ્રવેશ',
          title: 'શૈક્ષણિક વર્ષ ૨૦૨૬-૨૭ માટે પ્રવેશ પ્રક્રિયા શરૂ',
          desc: 'ધોરણ ૯, ૧૦, ૧૧ અને ૧૨ કોમર્સ માટે પ્રવેશ ફોર્મ ઉપલબ્ધ છે. વહીવટી કાર્યાલયનો સંપર્ક કરવો.',
        },
        {
          date: '૦૫ સપ્ટેમ્બર, ૨૦૨૬',
          category: 'ઉજવણી',
          title: 'શિક્ષક દિનની ભવ્ય ઉજવણી',
          desc: 'વિદ્યાર્થીઓ દ્વારા શિક્ષકોનું સન્માન અને શૈક્ષણિક તથા સાંસ્કૃતિક કાર્યક્રમોનું આયોજન.',
        },
        {
          date: '૧૫ ઓગસ્ટ, ૨૦૨૬',
          category: 'રાષ્ટ્રીય પર્વ',
          title: '૭૯મા સ્વાતંત્ર્ય પર્વની ધ્વજવંદન ઉજવણી',
          desc: 'ધ્વજવંદન સમારોહ, પરેડ અને દેશભક્તિ ગીતો સાથે રાષ્ટ્રીય પર્વની ઉજવણી કરવામાં આવી.',
        },
      ],
    },
    gallery: {
      tag: '— ફોટો ગેલેરી',
      title: 'શાળા જીવનની સ્મૃતિઓ.',
      filters: [
        { id: 'ALL', label: 'બધા' },
        { id: 'CAMPUS', label: 'કેમ્પસ' },
        { id: 'ACADEMICS', label: 'શૈક્ષણિક' },
        { id: 'SPORTS', label: 'રમતગમત' },
        { id: 'CULTURAL', label: 'સાંસ્કૃતિક' },
      ],
    },
    sharedJourney: {
      tag: '— સહિયારી સફર',
      title: 'શાળા માત્ર શીખવાની જગ્યા કરતાં પણ વધુ છે.',
      desc: 'વિદ્યાર્થીઓ, વાલીઓ, શિક્ષકો અને પૂર્વ વિદ્યાર્થીઓ મળીને એક સશક્ત સમુદાય રચે છે. આ સફરમાં આપનું સ્વાગત છે.',
      connectBtn: 'શાળા સાથે જોડાવો',
      followTag: '— અમારી સફર અનુસરો',
      handle: '@shreedjmahetahighschool',
      followLink: 'અમારી સાથે સોશિયલ મીડિયા પર જોડાઓ',
    },
    contact: {
      tag: '— સંપર્ક કરો',
      title: 'ચાલો વાતચીત શરૂ કરીએ.',
      desc: 'પ્રવેશ, મુલાકાત અથવા અન્ય માહિતી માટે અમને સંદેશ મોકલો. અમારું કાર્યાલય શાળાના સમય દરમિયાન આપની સેવામાં હાજર છે.',
      addressLabel: 'સરનામું',
      addressVal: 'પ્લોટ નં. ૫૦, સુભાષનગર પાસે, ભાવનગર, ગુજરાત - ૩૬૪૦૦૧',
      phoneLabel: 'ફોન નંબર',
      phoneVal: '+૯૧ ૨૭૮ ૨૪૨ ૪૫૫૦ / +૯૧ ૮૪૯૪૯ ૪૬૮૪૨',
      emailLabel: 'ઇમેઇલ',
      emailVal: 'contact@sdjmt.edu.in / info@sdjmt.edu.in',
      form: {
        nameLabel: 'પૂરું નામ',
        namePlaceholder: 'તમારું પૂરું નામ લખો',
        emailLabel: 'ઇમેઇલ',
        emailPlaceholder: 'you@example.com',
        phoneLabel: 'ફોન નંબર',
        phonePlaceholder: 'તમારો ૧૦ આંકડાનો મોબાઇલ નંબર',
        messageLabel: 'સંદેશ',
        messagePlaceholder: 'શાળા આપને કેવી રીતે મદદ કરી શકે?',
        submitBtn: 'પૂછપરછ મોકલો',
        sendingBtn: 'મોકલી રહ્યાં છીએ...',
        successMsg: 'આભાર! તમારી પૂછપરછ સફળતાપૂર્વક શાળા વહીવટી કાર્યાલયને મોકલાઈ ગઈ છે.',
        errorMsg: 'ક્ષમા કરશો, પૂછપરછ મોકલવામાં મુશ્કેલી આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.',
      },
    },
    footer: {
      schoolDesc: 'શ્રી ધનેશકુમાર જસવંતલાલ મહેતા હાઇસ્કૂલ, ભાવનગર, ગુજરાતની સત્તાવાર વેબસાઇટ. સંચાલક: ભાવનગર કેળવણી મંડળ (સ્થાપના: ૧૯૫૯).',
      exploreTitle: 'વિભાગો',
      contactTitle: 'સંપર્ક માહિતી',
      portalBtn: 'શાળા સોફ્ટવેર (ERP) લોગિન',
      copyright: '© ૨૦૨૬ શ્રી ધનેશકુમાર જસવંતલાલ મહેતા હાઇસ્કૂલ. સર્વાધિકાર સુરક્ષિત.',
      locationBadge: 'ભાવનગર, ગુજરાત',
    },
  },

  hi: {
    nav: {
      brandName: 'श्री धनेशकुमार',
      brandSub: 'जसवंतलाल महेता हाई स्कूल',
      about: 'हमारे बारे में',
      academics: 'शैक्षणिक',
      campusLife: 'परिसर जीवन',
      activities: 'गतिविधियां',
      achievements: 'उपलब्धियां',
      gallery: 'गैलरी',
      newsEvents: 'समाचार एवं कार्यक्रम',
      contact: 'संपर्क',
      enquireNow: 'पूछताछ करें',
    },
    hero: {
      tag: '— आगे के सफर के लिए एक विद्यालय',
      title: 'आज सीखें. कल बनाएं.',
      subtitle: 'जहां शिक्षा, चरित्र, अनुशासन और जिज्ञासा मिलकर प्रत्येक विद्यार्थी के विकास को दिशा देते हैं।',
      discoverBtn: 'हमारे विद्यालय को जानें',
      getInTouchBtn: 'संपर्क करें',
      scrollExplore: 'और देखने के लिए नीचे स्क्रॉल करें',
    },
    intro: {
      tag: '— हमारा परिचय',
      title: 'केवल एक विद्यालय नहीं. विकास का स्थल.',
      desc: 'श्री धनेशकुमार जसवंतलाल महेता हाई स्कूल में शिक्षा एक साझा यात्रा है: उद्देश्य के साथ सीखते विद्यार्थी, स्नेहपूर्ण मार्गदर्शन करते शिक्षक और साथ मिलकर बढ़ता समुदाय। भावनगर केलवणी मंडल के तहत 1959 से सेवारत।',
      discoverStoryBtn: 'हमारा इतिहास जानें',
      values: [
        { num: '01', title: 'शिक्षा' },
        { num: '02', title: 'चरित्र' },
        { num: '03', title: 'अनुशासन' },
        { num: '04', title: 'दायित्व' },
        { num: '05', title: 'जिज्ञासा' },
        { num: '06', title: 'समुदाय' },
      ],
    },
    about: {
      tag: '— विद्यालय के बारे में',
      title: 'दैनिक शिक्षा से आकार लेती एक प्रतिष्ठित संस्था.',
      subtitle: 'यह संस्था विद्यार्थियों के समग्र विकास, नैतिक मूल्यों, चरित्र निर्माण और गुणवत्तापूर्ण शिक्षा के लिए समर्पित है।',
      pillars: [
        {
          num: '01',
          title: 'हमारा इतिहास',
          desc: '1959 में स्थापित हमारा विद्यालय 65 से अधिक वर्षों से भावनगर में शिक्षा के क्षेत्र में अग्रणी रहकर राष्ट्र निर्माण में योगदान दे रहा है।',
          image: '/images/school_photo_1.jpg',
        },
        {
          num: '02',
          title: 'हमारा विजन',
          desc: 'एक ऐसे शिक्षण समुदाय का निर्माण करना जहां जिज्ञासा नवाचार को प्रेरित करे और प्रत्येक छात्र भविष्य के लिए तैयार हो।',
          image: '/images/school_photo_2.jpg',
        },
        {
          num: '03',
          title: 'हमारा मिशन',
          desc: 'प्रत्येक विद्यार्थी को सुलभ, आधुनिक और मूल्य आधारित शिक्षा प्रदान करना जिससे वे बौद्धिक और नैतिक रूप से सशक्त बनें।',
          image: '/images/school_photo_3.jpg',
        },
        {
          num: '04',
          title: 'हमारे मूल्य',
          desc: 'अनुशासन, ईमानदारी, सम्मान, परिश्रम और सेवाभाव हमारे शैक्षणिक दर्शन के मूल स्तंभ हैं।',
          image: '/images/school_photo_4.jpg',
        },
      ],
    },
    academics: {
      tag: '— शैक्षणिक व्यवस्था',
      title: 'शिक्षा के लिए एक विचारशील और प्रेरक वातावरण.',
      cards: [
        {
          num: '01',
          title: 'कक्षाएं एवं मानक',
          desc: 'गुजरात माध्यमिक एवं उच्चतर माध्यमिक शिक्षा बोर्ड (GSEB) से संबद्ध कक्षा 9 से 12 (सामान्य एवं वाणिज्य संकाय) की गुणवत्तापूर्ण शिक्षा।',
        },
        {
          num: '02',
          title: 'पाठ्यक्रम एवं विषय',
          desc: 'गणित, विज्ञान एवं प्रौद्योगिकी, लेखाशास्त्र, सांख्यिकी, अर्थशास्त्र, व्यवसाय प्रबंधन, भाषाएं और कंप्यूटर शिक्षा।',
        },
        {
          num: '03',
          title: 'शैक्षणिक सुविधाएं',
          desc: 'हवादार कक्षाएं, आधुनिक विज्ञान व कंप्यूटर प्रयोगशालाएं, समृद्ध पुस्तकालय एवं डिजिटल शिक्षण उपकरण।',
        },
        {
          num: '04',
          title: 'विद्यार्थी विकास',
          desc: 'व्यक्तिगत मार्गदर्शन, करियर परामर्श, उपचारात्मक शिक्षण और सर्वांगीण प्रगति के लिए निरंतर मूल्यांकन।',
        },
      ],
    },
    campus: {
      tag: '— परिसर जीवन',
      title: 'विद्यालय के दिनों का जीवंत माहौल.',
      subtitle: 'विद्यार्थी जीवन को प्रेरणादायक और स्मरणीय बनाने वाले क्षणों और स्थानों की एक सुंदर झलक।',
      badge1: 'परिसर / मुख्य भवन',
      badge2: 'पुस्तकालय / ज्ञान केंद्र',
      badge3: 'शिक्षण / प्रयोगशालाएं',
    },
    activities: {
      tag: '— गतिविधियां एवं छात्र जीवन',
      title: 'शिक्षा केवल कक्षा तक सीमित नहीं है.',
      items: [
        {
          num: '01',
          title: 'खेलकूद एवं शारीरिक विकास',
          desc: 'एथलेटिक्स, क्रिकेट, वॉलीबॉल, कबड्डी, योगाभ्यास और वार्षिक खेल महोत्सव के माध्यम से खेल भावना का विकास।',
        },
        {
          num: '02',
          title: 'सांस्कृतिक कार्यक्रम',
          desc: 'वार्षिक उत्सव, पारंपरिक नृत्य, नाटक, संगीत और राष्ट्रीय पर्वों का भव्य एवं उल्लासपूर्ण आयोजन।',
        },
        {
          num: '03',
          title: 'प्रतियोगिताएं एवं वाद-विवाद',
          desc: 'भाषण प्रतियोगिता, विज्ञान प्रदर्शनी, गणित क्विज, चित्रकला और निबंध प्रतियोगिताओं द्वारा प्रतिभा का विकास।',
        },
        {
          num: '04',
          title: 'सामाजिक एवं सेवा गतिविधियां',
          desc: 'वृक्षारोपण अभियान, स्वच्छता पखवाड़ा, पर्यावरण संरक्षण और समाज सेवा परियोजनाएं।',
        },
      ],
    },
    achievements: {
      tag: '— उपलब्धियां',
      title: 'गर्व करने योग्य प्रेरणादायक क्षण.',
      boxTitle: 'शैक्षणिक उत्कृष्टता एवं मील के पत्थर',
      boxDesc: 'बोर्ड परीक्षाओं में शत-प्रतिशत सफलता, खेलकूद एवं सांस्कृतिक प्रतियोगिताओं में उत्कृष्ट प्रदर्शन।',
      stats: [
        { value: '65+', label: 'वर्षों का गौरवशाली इतिहास' },
        { value: '100%', label: 'बोर्ड परीक्षा परिणाम' },
        { value: '25+', label: 'राज्य एवं जिला स्तरीय पुरस्कार' },
        { value: '15,000+', label: 'सफल पूर्व छात्र' },
      ],
    },
    news: {
      tag: '— समाचार एवं कार्यक्रम',
      title: 'विद्यालय के नवीनतम समाचार.',
      viewAll: 'सभी अपडेट देखें',
      items: [
        {
          date: '15 सितंबर, 2026',
          category: 'प्रवेश',
          title: 'शैक्षणिक सत्र 2026-2027 के लिए प्रवेश प्रारंभ',
          desc: 'कक्षा 9, 10, 11 एवं 12 कॉमर्स के लिए प्रवेश प्रक्रिया जारी है। विद्यालय कार्यालय से संपर्क करें।',
        },
        {
          date: '05 सितंबर, 2026',
          category: 'समारोह',
          title: 'शिक्षक दिवस का भव्य आयोजन',
          desc: 'विद्यार्थियों द्वारा आदरणीय शिक्षकों का सम्मान और रंगारंग सांस्कृतिक कार्यक्रमों की प्रस्तुति।',
        },
        {
          date: '15 अगस्त, 2026',
          category: 'राष्ट्रीय पर्व',
          title: '79वां स्वतंत्रता दिवस समारोह',
          desc: 'ध्वजारोहण, परेड और देशभक्ति गीतों के साथ राष्ट्रीय पर्व धूमधाम से मनाया गया।',
        },
      ],
    },
    gallery: {
      tag: '— फोटो गैलरी',
      title: 'विद्यालय जीवन की सुंदर स्मृतियां.',
      filters: [
        { id: 'ALL', label: 'सभी' },
        { id: 'CAMPUS', label: 'परिसर' },
        { id: 'ACADEMICS', label: 'शैक्षणिक' },
        { id: 'SPORTS', label: 'खेलकूद' },
        { id: 'CULTURAL', label: 'सांस्कृतिक' },
      ],
    },
    sharedJourney: {
      tag: '— एक साझा यात्रा',
      title: 'विद्यालय केवल सीखने की जगह से कहीं अधिक है.',
      desc: 'विद्यार्थी, अभिभावक, शिक्षक और पूर्व छात्र मिलकर एक सशक्त समुदाय बनाते हैं। आप सभी का स्वागत है।',
      connectBtn: 'विद्यालय से जुड़ें',
      followTag: '— हमारा सफर देखें',
      handle: '@shreedjmahetahighschool',
      followLink: 'सोशल मीडिया पर हमारे साथ जुड़ें',
    },
    contact: {
      tag: '— विद्यालय से संपर्क करें',
      title: 'आइए बातचीत शुरू करें.',
      desc: 'प्रवेश, विद्यालय भ्रमण या अन्य किसी भी जानकारी के लिए हमें संदेश भेजें। हमारा कार्यालय आपकी सेवा में सदैव तत्पर है।',
      addressLabel: 'पता',
      addressVal: 'प्लॉट नं. 50, सुभाषनगर के पास, भावनगर, गुजरात - 364001',
      phoneLabel: 'फोन नंबर',
      phoneVal: '+91 278 242 4550 / +91 84949 46842',
      emailLabel: 'ईमेल',
      emailVal: 'contact@sdjmt.edu.in / info@sdjmt.edu.in',
      form: {
        nameLabel: 'पूरा नाम',
        namePlaceholder: 'अपना पूरा नाम दर्ज करें',
        emailLabel: 'ईमेल',
        emailPlaceholder: 'you@example.com',
        phoneLabel: 'फोन नंबर',
        phonePlaceholder: 'अपना 10 अंकों का मोबाइल नंबर दर्ज करें',
        messageLabel: 'संदेश',
        messagePlaceholder: 'विद्यालय आपकी किस प्रकार सहायता कर सकता है?',
        submitBtn: 'पूछताछ भेजें',
        sendingBtn: 'भेज रहे हैं...',
        successMsg: 'धन्यवाद! आपकी पूछताछ सफलतापूर्वक विद्यालय कार्यालय को भेज दी गई है।',
        errorMsg: 'क्षमा करें, पूछताछ भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
      },
    },
    footer: {
      schoolDesc: 'श्री धनेशकुमार जसवंतलाल महेता हाई स्कूल, भावनगर, गुजरात की आधिकारिक वेबसाइट। संचालन: भावनगर केलवणी मंडल (स्थापना: 1959)।',
      exploreTitle: 'महत्वपूर्ण लिंक',
      contactTitle: 'संपर्क विवरण',
      portalBtn: 'स्कूल सॉफ्टवेयर (ERP) लॉगिन',
      copyright: '© 2026 श्री धनेशकुमार जसवंतलाल महेता हाई स्कूल। सर्वाधिकार सुरक्षित।',
      locationBadge: 'भावनगर, गुजरात',
    },
  },
};
