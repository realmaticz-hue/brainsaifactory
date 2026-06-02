
export interface BusinessData {
  businessName: string;
  website: string;
  description: string;
  content: string;
  keywords: string[];
  keyPoints: string[];
  headings: string[];
  posts7sec: string[];
  posts30sec: string[];
}



interface BusinessTemplate {
  keywords: string[];
  name: string;
  data: BusinessData;
}

const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    keywords: ['coffee', 'cafe', 'roast', 'espresso', 'barista'],
    name: 'Coffee Shop',
    data: {
      content: 'Artisan Coffee House - Premium handcrafted coffee and espresso drinks made from ethically sourced, small-batch roasted beans. Cozy atmosphere perfect for remote work or catching up with friends. Locally owned and operated since 2015.',
      posts7sec: [
        'Start your morning right at Artisan Coffee House! Premium handcrafted espresso drinks await. Visit us today!',
        'Ethically sourced, small-batch roasted perfection in every cup. Your new favorite coffee spot is calling. Come taste the difference!',
        'Cozy vibes, fast WiFi, amazing coffee. The perfect remote work spot is here. Artisan Coffee House welcomes you!',
        'From cappuccino to cold brew, we craft excellence. Locally owned, globally inspired. Experience artisan coffee done right!',
        'Meet friends over expertly pulled espresso shots. Warm atmosphere, exceptional service, unforgettable flavors. Your table is ready!',
        'Fair trade beans, sustainable practices, incredible taste. Coffee with a conscience. Join our community today!',
        'Early bird or night owl? We&apos;ve got you covered with extended hours. Premium coffee whenever you need it!',
        'Seasonal specialty drinks crafted by expert baristas. Limited time flavors you won&apos;t want to miss. Stop by now!',
        'Fresh pastries pair perfectly with our signature blends. Breakfast, lunch, or afternoon treats await. Delicious moments start here!',
        'Loyalty rewards for our favorite customers! Every cup gets you closer to free drinks. Download our app today!',
        'Private event space available for meetings and gatherings. Coffee catering that impresses. Book your next event with us!',
        'Local art on our walls, local beans in your cup. Supporting community one sip at a time. Welcome home!'
      ],
      posts30sec: [
        'Welcome to Artisan Coffee House, where every cup tells a story! Our expert baristas handcraft each drink using premium, ethically sourced beans roasted in small batches for maximum freshness. Whether you&apos;re grabbing a quick espresso or settling in for a remote work session, our cozy atmosphere and fast WiFi make us your perfect destination. Visit us today and discover why locals call us their home away from home!',
        'Exceptional coffee starts with exceptional beans. At Artisan Coffee House, we partner directly with sustainable farms to bring you the finest ethically sourced coffee. Our small-batch roasting process ensures peak flavor in every sip. From classic cappuccinos to innovative seasonal specials, our menu delights coffee lovers of all kinds. Join our community and taste the difference that passion and quality make!',
        'Looking for the perfect workspace? Artisan Coffee House combines premium coffee with an inviting atmosphere designed for productivity. Enjoy fast, reliable WiFi, comfortable seating, and unlimited refills on drip coffee. Our baristas create the fuel you need to power through your day. Plus, our fresh-baked pastries and light lunch options keep you energized. Work smarter, not harder, at your new favorite office!',
        'Sustainability meets exceptional taste at Artisan Coffee House. We&apos;re committed to fair trade practices, eco-friendly packaging, and supporting local communities. Every purchase helps build a better coffee industry for farmers and the environment. Our seasonal drink menu showcases innovative flavors while our classics never disappoint. Experience coffee with a conscience. Visit us and feel good about every sip!',
        'Your coffee ritual deserves an upgrade. Artisan Coffee House offers expertly crafted espresso drinks, pour-overs, and cold brews that rival any big city cafe. Our baristas train extensively to perfect each technique, ensuring consistency and quality. Whether you&apos;re a coffee connoisseur or just beginning your journey, we&apos;ll help you discover your perfect drink. Elevate your coffee experience today!',
        'Community is at the heart of everything we do at Artisan Coffee House. From featuring local artists on our walls to sourcing ingredients from nearby bakeries, we celebrate our neighborhood. Our warm, welcoming staff knows regulars by name and makes newcomers feel right at home. Join us for open mic nights, book clubs, and community events. More than coffee, we&apos;re building connections!',
        'Busy schedule? No problem! Artisan Coffee House offers mobile ordering through our app. Skip the line, earn loyalty rewards, and get notifications about new seasonal drinks. Order ahead and we&apos;ll have your favorite drink ready when you arrive. Plus, every purchase earns points toward free coffee. Download our app today and make your coffee runs even more convenient!',
        'Celebrate the seasons with us at Artisan Coffee House! Our rotating menu features limited-time drinks crafted from seasonal ingredients. From pumpkin spice lattes in fall to refreshing fruit-infused cold brews in summer, there&apos;s always something new to try. Our baristas love experimenting with flavors and creating Instagram-worthy presentations. Don&apos;t miss out on this month&apos;s featured drinks!',
        'Fuel your morning with more than just coffee. Artisan Coffee House serves fresh-baked croissants, muffins, bagels, and breakfast sandwiches made daily. Our lunch menu includes gourmet sandwiches, salads, and soups perfect for a quick midday break. Everything pairs beautifully with our signature coffee blends. Start your day deliciously at Artisan Coffee House!',
        'Planning a meeting or special event? Artisan Coffee House offers private event space and catering services. Impress clients with professionally crafted coffee and tea service. Our flexible packages include everything from simple beverage stations to full breakfast and lunch spreads. We handle the details so you can focus on what matters. Contact us to book your next event!',
        'Quality coffee shouldn&apos;t break the bank. At Artisan Coffee House, we offer premium drinks at fair prices. Our loyalty program rewards frequent visitors with free drinks, exclusive discounts, and early access to new menu items. Students and seniors enjoy special pricing. Great coffee for everyone, every day. Join our family and start saving!',
        'Experience the art of coffee at Artisan Coffee House. Watch our skilled baristas transform simple ingredients into beautiful, delicious creations. We&apos;re passionate about our craft and love sharing that enthusiasm with every customer. From the perfect latte art to the ideal brew temperature, we obsess over details. Taste the dedication in every cup. We can&apos;t wait to serve you!'
      ],
      description: undefined,
      businessName: "",
      website: "",
      keywords: [],
      keyPoints: [],
      headings: []
    }
  },
  {
    keywords: ['fitness', 'gym', 'workout', 'train', 'health', 'exercise'],
    name: 'Fitness Center',
    data: {
      content: 'Elite Fitness Center - State-of-the-art equipment, certified personal trainers, and group classes for all fitness levels. 24/7 access, luxurious locker rooms, and a supportive community. Transform your body and mind with us.',
      posts7sec: [
        'Ready to transform? Elite Fitness Center has everything you need to reach your goals. State-of-the-art equipment awaits!',
        'Train anytime with 24/7 access! Our facility never sleeps, so your fitness journey never stops. Join Elite today!',
        'Expert personal trainers create custom workout plans just for you. Real results, real support. Your transformation starts now!',
        'From yoga to HIIT, our group classes motivate and inspire. All fitness levels welcome. Find your tribe here!',
        'Premium equipment, luxurious amenities, unbeatable atmosphere. Elite Fitness Center redefines the gym experience. Tour today!',
        'New member special! First month half price plus free personal training session. Limited time offer. Sign up now!',
        'Progress tracking, nutrition guidance, accountability partners. We&apos;re more than a gym, we&apos;re your success team. Let&apos;s start!',
        'Clean facilities, top-tier equipment, friendly staff. The gym you&apos;ll actually want to visit. Experience Elite difference!',
        'Strength training, cardio, stretching zones, and more. Everything under one roof for complete fitness. Explore our space!',
        'Join hundreds of success stories! Real people, real results, real community. Your fitness family is waiting. Welcome home!',
        'Virtual classes available for home workouts. Gym access plus online content. Fitness flexibility at its finest!',
        'Student and family discounts make Elite affordable for everyone. Premium fitness shouldn&apos;t be a luxury. Get started!'
      ],
      posts30sec: [
        'Welcome to Elite Fitness Center, where your transformation begins! Our 40,000 square foot facility features state-of-the-art equipment including brand new cardio machines, free weights, strength training stations, and functional fitness areas. With 24/7 access, you can work out on your schedule. Our certified personal trainers create customized programs tailored to your goals. Join our community of motivated members and discover what elite fitness truly means!',
        'Achieve your fitness goals with expert guidance at Elite Fitness Center. Our certified personal trainers have decades of combined experience helping clients lose weight, build muscle, and improve overall health. Every membership includes a complimentary fitness assessment and personalized workout plan. We track your progress, adjust your program, and keep you accountable. With Elite, you&apos;re never working out alone. Your success is our mission!',
        'Group fitness classes that motivate and inspire! Elite Fitness Center offers over 50 classes per week including yoga, Zumba, spin, HIIT, boxing, and more. Our passionate instructors create energizing workouts suitable for all fitness levels. The community atmosphere keeps you coming back while the variety keeps workouts exciting. First class is always free. Join us and discover the power of group fitness!',
        'Premium amenities make every visit exceptional at Elite Fitness Center. Enjoy luxurious locker rooms with rainfall showers, complimentary towel service, and spacious changing areas. Our facility includes dedicated stretching zones, saunas, smoothie bar, and lounge areas. Free WiFi and charging stations keep you connected. We maintain spotless cleanliness standards. Experience a gym that feels like a luxury spa!',
        'Transform your body and mindset at Elite Fitness Center. We believe fitness is a lifestyle, not a temporary fix. Our holistic approach includes workout programming, nutrition coaching, mindfulness practices, and community support. Members access exclusive wellness seminars, healthy cooking demonstrations, and mental health resources. Join a gym that cares about your complete well-being, not just physical fitness!',
        'Special offer for new members! Sign up this month and receive 50 percent off your first month, plus a free personal training session and complimentary fitness assessment. No enrollment fees, no long-term contracts required. We&apos;re so confident you&apos;ll love Elite that we make joining risk-free. Limited spots available. Visit today and start your transformation at half the cost!',
        'Cutting-edge technology meets fitness at Elite Fitness Center. Our equipment features integrated screens for virtual training, progress tracking, and entertainment. Use our mobile app to book classes, schedule trainer sessions, and monitor your fitness metrics. Smart body composition scanners provide detailed insights into your progress. We blend innovation with inspiration to keep you motivated and informed!',
        'Family-friendly fitness for everyone at Elite Fitness Center! We offer childcare services, teen programs, and family membership discounts. Parents can work out worry-free knowing kids are engaged in age-appropriate activities. Our family locker rooms provide convenience for busy parents. Teach your children healthy habits early. Build a stronger family together at Elite!',
        'Never get bored with endless workout options at Elite Fitness Center. Our facility includes separate zones for cardio, strength training, functional fitness, Olympic lifting, boxing, and stretching. Indoor track, basketball court, and swimming pool provide variety. Seasonal outdoor boot camps add fresh air to your routine. With so many options, every workout feels different. Discover your favorite today!',
        'Join Elite Fitness Center&apos;s supportive community! Our members motivate each other, celebrate victories together, and build lasting friendships. Regular social events, fitness challenges, and community service projects strengthen our bonds. Unlike big box gyms where you&apos;re just a number, Elite feels like family. Everyone knows your name and cheers your progress. Find your tribe here!',
        'Flexible membership options fit any lifestyle at Elite Fitness Center. Choose from month-to-month, annual, student, senior, or corporate memberships. Add-ons include unlimited classes, personal training packages, and nutrition coaching. We offer freeze options for travel and life changes. Fitness should adapt to your needs. Find the perfect plan for you today!',
        'Results-driven programs deliver real transformation at Elite Fitness Center. Our 6-week challenge combines personal training, nutrition planning, and accountability coaching. Members lose an average of 15 pounds and gain confidence, energy, and strength. Before and after photos prove what&apos;s possible. Success stories inspire new members daily. Write your own transformation story. Start your journey now!'
      ],
      description: undefined,
      businessName: "",
      website: "",
      keywords: [],
      keyPoints: [],
      headings: []
    }
  },
  {
    keywords: ['restaurant', 'dining', 'food', 'cuisine', 'chef', 'menu'],
    name: 'Restaurant',
    data: {
      content: 'Bella Vista Restaurant - Authentic Italian cuisine crafted from family recipes passed down through generations. Fresh ingredients, handmade pasta, wood-fired pizzas, and an extensive wine list. Intimate dining atmosphere perfect for any occasion.',
      posts7sec: [
        'Authentic Italian flavors await at Bella Vista! Family recipes, fresh ingredients, unforgettable taste. Reserve your table tonight!',
        'Handmade pasta crafted daily by our expert chefs. Traditional techniques, modern excellence. Taste Italy at Bella Vista!',
        'Wood-fired pizza perfection! Crispy crust, premium toppings, authentic Italian style. Your new favorite pizza is here!',
        'Romantic date night or family celebration? Our intimate atmosphere sets the perfect mood. Book Bella Vista now!',
        'Extensive wine list featuring Italian and local favorites. Perfect pairings for every dish. Elevate your dining experience!',
        'Fresh ingredients sourced daily create exceptional flavors. Quality you can taste in every bite. Experience Bella Vista!',
        'Lunch specials Monday through Friday! Authentic Italian cuisine at incredible value. Quick service, amazing taste!',
        'Private dining room available for special events. Customized menus, exceptional service, memorable moments. Inquire today!',
        'Weekend brunch featuring Italian-inspired favorites! Bottomless mimosas and delicious dishes. Start your weekend right!',
        'Gluten-free and vegetarian options that don&apos;t compromise flavor. Everyone enjoys Bella Vista. See our full menu!',
        'Outdoor patio dining under twinkling lights. Perfect weather, perfect food, perfect evening. Join us tonight!',
        'Gift certificates make perfect presents for food lovers. Share the Bella Vista experience. Purchase online now!'
      ],
      posts30sec: [
        'Welcome to Bella Vista Restaurant, where authentic Italian cuisine meets warm hospitality! Our family recipes have been perfected over generations, bringing you the true flavors of Italy. Every dish is crafted with fresh, high-quality ingredients sourced daily from local suppliers. From handmade pasta to wood-fired pizzas, our talented chefs pour passion into every plate. Whether celebrating a special occasion or enjoying a casual dinner, Bella Vista creates unforgettable dining experiences. Reserve your table today!',
        'Experience the art of handmade pasta at Bella Vista Restaurant. Each morning, our chefs roll, cut, and shape fresh pasta using traditional Italian techniques passed down through our family. We use organic eggs and premium semolina flour for authentic taste and perfect texture. From classic fettuccine alfredo to creative seasonal specials, our pasta dishes transport you straight to Italy. Paired with our homemade sauces and topped with fresh herbs, every bite is pure perfection. Taste the difference today!',
        'Pizza lovers rejoice! Bella Vista&apos;s wood-fired oven reaches perfect temperatures for authentic Neapolitan-style pizza. Our dough ferments for 48 hours, creating the ideal crispy yet chewy crust. We top each pizza with San Marzano tomatoes, fresh mozzarella, and premium ingredients. Classic Margherita or adventurous specialty pies, our menu satisfies every craving. Watch our pizzaiolos craft your pizza with skill and flair. Come hungry, leave happy!',
        'Bella Vista&apos;s intimate atmosphere creates the perfect setting for romance and celebration. Soft lighting, Italian music, and attentive service set the mood for unforgettable evenings. Our knowledgeable servers guide you through menu selections and wine pairings. Whether it&apos;s a first date, anniversary, or family gathering, we make every occasion special. Private dining rooms accommodate larger parties with customized menus. Let us host your next memorable event!',
        'Elevate your meal with Bella Vista&apos;s carefully curated wine list. We feature Italian varietals from renowned regions alongside local favorites. Our sommelier personally selects each bottle to complement our cuisine perfectly. By-the-glass options let you explore different pairings throughout your meal. Wine tastings and pairing dinners showcase seasonal specialties. Whether you&apos;re a connoisseur or curious beginner, we&apos;ll help you discover your new favorite vintage!',
        'Farm-to-table freshness defines Bella Vista&apos;s approach to Italian cuisine. We partner with local farms for seasonal produce, sustainable seafood, and artisanal cheeses. Our menu changes with the seasons to showcase peak ingredients at their finest. This commitment to quality means every dish bursts with authentic flavor. Taste the difference that fresh, responsibly sourced ingredients make. Your health and satisfaction matter to us!',
        'Busy professionals love Bella Vista&apos;s weekday lunch specials! Enjoy authentic Italian cuisine with quick, efficient service perfect for lunch breaks. Our express menu features smaller portions of signature dishes at exceptional value. Takeout options available for office lunches or meals at home. Same great taste, convenient timing, affordable prices. Elevate your lunch routine Monday through Friday at Bella Vista!',
        'Celebrate special occasions at Bella Vista&apos;s private dining room! Accommodate up to 40 guests in an elegant, intimate space. Our event coordinator works with you to create customized menus featuring your favorite dishes. From rehearsal dinners to business meetings, we handle every detail professionally. Premium wine pairings, personalized service, and memorable meals make your event exceptional. Contact us to start planning today!',
        'Weekend brunch at Bella Vista brings Italian flair to morning favorites! Indulge in frittatas, bruschetta, fresh pastries, and creative specialty dishes. Our bottomless mimosa package adds sparkle to lazy weekend mornings. Family-friendly atmosphere welcomes guests of all ages. Reservations recommended for our popular brunch service. Start your Saturday or Sunday deliciously at Bella Vista!',
        'Dietary restrictions never mean compromising on flavor at Bella Vista! Our extensive menu includes gluten-free pasta, vegetarian entrees, and vegan options. We accommodate allergies and preferences with care and creativity. Our chefs take pride in crafting delicious dishes for every diner. Everyone deserves exceptional Italian cuisine. Review our full menu and ask your server about customization options!',
        'Al fresco dining on Bella Vista&apos;s charming patio! Twinkling string lights, comfortable seating, and fresh air enhance your dining experience. Perfect for warm evenings and special occasions. Our outdoor space creates a romantic European ambiance right in your neighborhood. Weather permitting, choose patio seating when making reservations. Enjoy Italy under the stars at Bella Vista!',
        'Share the Bella Vista experience with loved ones! Our gift certificates make perfect presents for birthdays, holidays, and thank-you gifts. Available in any denomination and valid for dining, takeout, or private events. Purchase online or in-person at our host stand. Give the gift of exceptional Italian cuisine. Someone special will thank you after their Bella Vista meal!'
      ],
      description: undefined,
      businessName: "",
      website: "",
      keywords: [],
      keyPoints: [],
      headings: []
    }
  },
  {
    keywords: ['salon', 'spa', 'beauty', 'hair', 'nails', 'massage', 'facial'],
    name: 'Spa & Salon',
    data: {
      content: 'Serenity Spa & Salon - Luxurious beauty and wellness services in a tranquil environment. Expert stylists, licensed aestheticians, massage therapists. Hair, nails, facials, massages, and spa packages. Relax, rejuvenate, reveal your natural beauty.',
      posts7sec: [
        'Transform your look at Serenity Spa & Salon! Expert stylists create stunning cuts, colors, and styles. Book now!',
        'Pamper yourself with our signature spa packages. Massages, facials, and full body treatments await. Pure relaxation!',
        'Beautiful nails are just an appointment away! Manicures, pedicures, nail art by talented technicians. Gorgeous results!',
        'Licensed aestheticians provide customized facial treatments for glowing skin. Tailored to your needs. Radiant beauty!',
        'Stress melts away with therapeutic massage services. Swedish, deep tissue, hot stone available. Ultimate relaxation!',
        'Bridal packages make your special day flawless! Hair, makeup, nails for the entire wedding party. Picture perfect!',
        'New client special: 20% off your first visit! Experience Serenity luxury at an incredible value. Schedule today!',
        'Gift certificates available for every service and package. Perfect presents for those who deserve pampering. Shop now!',
        'Membership programs offer exclusive perks and discounts. Priority booking, special rates, bonus services. Join Serenity!',
        'Premium product lines available for purchase. Extend your salon results at home. Ask about our recommendations!',
        'Consultation appointments ensure perfect results. Discuss your vision with experts before committing. We listen!',
        'Tranquil atmosphere, calming music, aromatherapy throughout. Escape daily stress. Your sanctuary awaits at Serenity!'
      ],
      posts30sec: [
        'Welcome to Serenity Spa & Salon, your destination for luxury beauty and wellness services! Our talented team of expert stylists, licensed aestheticians, and massage therapists create personalized experiences tailored to your unique needs. From precision haircuts and dimensional color to rejuvenating facials and therapeutic massages, we offer comprehensive services in a tranquil environment. Using premium products and advanced techniques, we help you look and feel your absolute best. Book your appointment and discover true serenity!',
        'Transform your hair with Serenity&apos;s master stylists! Whether you&apos;re seeking a subtle change or dramatic makeover, our team brings vision to life. We specialize in precision cuts, balayage, highlights, keratin treatments, and special occasion styling. Complimentary consultations ensure we understand your goals and hair type. We use only premium product lines that nourish while styling. Leave feeling confident and beautiful. Your dream hair starts here at Serenity!',
        'Indulge in ultimate relaxation with Serenity&apos;s spa services! Our licensed massage therapists offer Swedish, deep tissue, hot stone, and aromatherapy massages customized to relieve tension and restore balance. Aestheticians provide facial treatments using medical-grade products to address aging, acne, dryness, and other concerns. Body wraps, scrubs, and specialty treatments complete our wellness menu. Packages combine multiple services for full-day pampering. Escape stress and embrace serenity!',
        'Beautiful nails complete your polished look! Serenity&apos;s nail technicians provide meticulous manicures and pedicures using gentle techniques and premium polishes. Choose from classic styles, gel applications, or creative nail art. Our spa pedicures include exfoliation, massage, and callus treatment for baby-soft feet. Relaxing hand and foot treatments turn routine maintenance into luxurious self-care. Book your nail appointment and step out with confidence!',
        'Radiant skin begins at Serenity Spa & Salon! Our licensed aestheticians analyze your skin and create customized facial treatments addressing your specific concerns. Anti-aging facials reduce fine lines and restore firmness. Acne facials deep clean pores and calm inflammation. Hydrating treatments replenish moisture for glowing skin. We use proven product lines with active ingredients that deliver real results. Reveal your most beautiful skin!',
        'Brides love Serenity&apos;s comprehensive wedding packages! We coordinate hair, makeup, and nail services for the entire wedding party. Trial sessions ensure perfection on your big day. Our team travels to your venue for convenient on-site services. Bridesmaids, mothers, and flower girls all receive expert attention. Spa packages help brides relax before the ceremony. From engagement to honeymoon, Serenity makes you radiant. Book your bridal consultation today!',
        'First-time visitors save 20 percent on any service at Serenity Spa & Salon! Experience our luxury treatments, talented team, and tranquil atmosphere at an exceptional value. This limited-time offer applies to haircuts, color, facials, massages, and more. Discover why clients call Serenity their beauty sanctuary. New client appointments available seven days a week. Call now to schedule and save!',
        'Serenity membership programs reward loyal clients with exclusive benefits! Priority booking ensures you get preferred appointment times. Members receive discounts on services and retail products plus bonus treatments throughout the year. Referral rewards, birthday gifts, and early access to promotions add extra value. Flexible membership tiers fit any budget. Invest in yourself with a Serenity membership. Inquire about enrollment today!',
        'Extend your salon results with professional products from Serenity! We carry premium brands recommended by our stylists and aestheticians. Color-safe shampoos, anti-aging serums, styling products, and specialty treatments maintain your investment between appointments. Our team provides personalized recommendations based on your hair type and skin concerns. Take home the products professionals trust. Shop our retail collection today!',
        'Every Serenity appointment begins with a thorough consultation. We listen to your concerns, discuss your goals, and explain our recommended approach. Stylists show color swatches and styling options. Aestheticians analyze skin conditions and suggest treatments. This collaborative process ensures you&apos;re comfortable and excited about your service. We never rush or pressure you. Your satisfaction matters most. Experience the Serenity difference!',
        'Serenity&apos;s tranquil environment promotes relaxation from the moment you arrive. Soft lighting, calming music, and aromatherapy create an oasis of peace. Comfortable robes, herbal tea, and attentive service enhance your experience. We maintain impeccable cleanliness and safety standards. Every detail is considered to provide sanctuary from daily stress. Visit Serenity and leave the outside world behind. Peace awaits!',
        'Give the gift of beauty and relaxation with Serenity gift certificates! Perfect for birthdays, holidays, anniversaries, or thank-you presents. Choose specific services or dollar amounts. Recipients enjoy flexibility to book preferred treatments. Gift certificates never expire and can be used for any service or product. Purchase online or in-salon. Share the Serenity experience with someone special today!'
      ],
      description: undefined,
      businessName: "",
      website: "",
      keywords: [],
      keyPoints: [],
      headings: []
    }
  },
  {
    keywords: ['lawyer', 'attorney', 'legal', 'law', 'justice'],
    name: 'Law Firm',
    data: {
      content: 'Anderson & Associates Law Firm - Experienced attorneys providing comprehensive legal services. Personal injury, family law, estate planning, business law. Dedicated representation with proven results. Free consultations available.',
      posts7sec: [
        'Injured? Get the compensation you deserve. Anderson & Associates fights for your rights. Free consultation today!',
        'Family law matters require compassionate expertise. Divorce, custody, support issues handled with care. Call us now!',
        'Protect your legacy with comprehensive estate planning. Wills, trusts, powers of attorney. Secure your family&apos;s future!',
        'Business legal needs? Formation, contracts, disputes resolved efficiently. Anderson & Associates helps businesses thrive!',
        '30 years combined experience winning cases. Proven track record of results. Your legal advocates are ready!',
        'Free initial consultations for all practice areas. Discuss your case with no obligation. Schedule your appointment!',
        'Personalized attention from experienced attorneys. You&apos;re never just a case number here. We care about your outcome!',
        'Aggressive representation, compassionate service. We fight hard while treating you with respect. Call Anderson & Associates!',
        'Bilingual services available for Spanish-speaking clients. Legal help in your language. Everyone deserves representation!',
        'Contingency fees available for personal injury cases. No upfront costs, we only win when you win. Risk-free consultation!',
        'Evening and weekend appointments accommodate busy schedules. Convenient times for working professionals. We work around you!',
        'Virtual consultations available via video call. Get legal advice from home. Technology meets legal expertise!'
      ],
      posts30sec: [
        'Anderson & Associates Law Firm provides experienced legal representation across multiple practice areas. Our dedicated attorneys have over 30 years combined experience successfully handling personal injury, family law, estate planning, and business matters. We understand that legal issues create stress and uncertainty. That&apos;s why we offer personalized attention, clear communication, and aggressive advocacy for every client. Free consultations help you understand your options without obligation. Let us put our expertise to work for you today!',
        'Suffered an injury due to someone else&apos;s negligence? Anderson & Associates fights to get you maximum compensation for medical bills, lost wages, and pain and suffering. Our personal injury attorneys handle car accidents, slip and falls, medical malpractice, and wrongful death claims. We investigate thoroughly, negotiate skillfully, and litigate aggressively when necessary. Contingency fee arrangements mean no upfront costs. You pay nothing unless we win your case. Call now for a free consultation!',
        'Family law matters require both legal expertise and emotional sensitivity. Anderson & Associates handles divorce, child custody, child support, spousal maintenance, and adoption with compassion and skill. We protect your rights while minimizing conflict whenever possible. Our attorneys explain the legal process clearly and keep you informed at every step. Whether through negotiation or courtroom advocacy, we pursue the best outcome for you and your children. Schedule your confidential consultation today!',
        'Secure your family&apos;s future with comprehensive estate planning from Anderson & Associates. Our attorneys draft wills, establish trusts, create powers of attorney, and develop healthcare directives tailored to your unique situation. We help minimize taxes, avoid probate delays, and ensure your wishes are honored. Estate administration and probate services guide families through difficult transitions. Protect your legacy and provide peace of mind. Contact us to discuss your estate planning needs!',
        'Business owners trust Anderson & Associates for reliable legal counsel. We assist with entity formation, contract drafting and review, employment matters, commercial litigation, and business succession planning. Our practical approach balances legal protection with business realities. We help you navigate regulations, resolve disputes efficiently, and make informed decisions. Whether you&apos;re launching a startup or managing an established company, we provide the legal support your business needs to thrive!',
        'Experience matters when choosing legal representation. Anderson & Associates attorneys have successfully resolved thousands of cases over three decades of practice. Our proven track record includes significant settlements, favorable judgments, and satisfied clients. We stay current on legal developments through continuing education and professional involvement. This combination of experience and ongoing learning gives clients confidence in our abilities. Trust your legal matters to attorneys with demonstrated results!',
        'Anderson & Associates believes everyone deserves access to quality legal advice. That&apos;s why we offer free initial consultations for all practice areas. Meet with an experienced attorney, discuss your situation, and learn about your legal options without any financial obligation. We explain fees clearly upfront so there are no surprises. This consultation helps you make informed decisions about representation. Call today to schedule your no-cost, no-obligation meeting!',
        'At Anderson & Associates, you&apos;re never just another case number. We provide personalized attention and direct attorney access throughout your legal matter. Your phone calls are returned promptly. Questions are answered thoroughly. You&apos;re kept informed of all developments. This client-focused approach builds trust and achieves better outcomes. We genuinely care about your situation and work tirelessly toward resolution. Experience the difference personalized service makes!',
        'Anderson & Associates combines aggressive legal representation with compassionate client service. We fight vigorously to protect your rights and achieve your goals. At the same time, we treat you with respect, empathy, and understanding during difficult times. Our balanced approach means strong advocacy doesn&apos;t come at the expense of human decency. You deserve an attorney who is both a fierce advocate and a caring counselor. Contact us today!',
        'Language should never be a barrier to quality legal representation. Anderson & Associates offers bilingual services for Spanish-speaking clients. Communicate with attorneys and staff in your preferred language. All documents, consultations, and communications are available in Spanish. We respect cultural differences and work to make legal processes accessible to all community members. Everyone deserves excellent legal representation. Schedule your Spanish-language consultation today!',
        'Busy schedule? Anderson & Associates accommodates working professionals with flexible appointment times. Evening and weekend consultations available by request. We also offer virtual meetings via secure video conferencing. Discuss your legal matters from home or office at times convenient for you. Modern technology enhances accessibility without sacrificing personal service. Legal help shouldn&apos;t require taking time off work. Contact us to schedule at your convenience!',
        'Personal injury cases at Anderson & Associates are handled on contingency fee basis. This means no upfront costs, no hourly fees, and no payment unless we win your case. When we secure a settlement or verdict, our fee is a percentage of your recovery. This arrangement makes quality legal representation accessible regardless of your financial situation. You have nothing to lose and everything to gain. Call for your free case evaluation today!'
      ],
      description: undefined,
      businessName: "",
      website: "",
      keywords: [],
      keyPoints: [],
      headings: []
    }
  },
  {
    keywords: ['realtor', 'realestate', 'property', 'home', 'house', 'buy', 'sell'],
    name: 'Real Estate Agency',
    data: {
      content: 'Premier Properties Realty - Top-rated real estate agency serving buyers and sellers. Expert market knowledge, personalized service, proven negotiation skills. Residential, commercial, investment properties. Your dream property awaits.',
      posts7sec: [
        'Buying or selling? Premier Properties delivers results! Expert agents, local market knowledge, exceptional service. Call us!',
        'Your dream home is out there! Our agents find perfect properties matching your needs. Start your search today!',
        'Selling your home? We get top dollar through expert marketing and negotiation. List with Premier Properties!',
        'First-time homebuyer? We guide you through every step with patience and expertise. Make homeownership a reality!',
        'Investment properties generating strong returns! Our team identifies lucrative opportunities. Build your portfolio now!',
        'Commercial real estate experts ready to assist! Office, retail, industrial properties. Business solutions await!',
        'Virtual tours, 3D walkthroughs, drone photography showcase your property beautifully. Modern marketing works!',
        'Pre-qualified buyers see homes faster! Get mortgage pre-approval assistance. Speed up your home search!',
        'Neighborhood experts know local schools, amenities, market trends. Make informed decisions. Trust our knowledge!',
        'Competitive commission rates without compromising service quality. Value and excellence combined. List today!',
        'Relocation services make moving stress-free! Area information, school research, community resources provided. We help!',
        'Client testimonials speak volumes! Five-star reviews prove our dedication. Join satisfied buyers and sellers!'
      ],
      posts30sec: [
        'Welcome to Premier Properties Realty, where exceptional real estate service is our standard! Our experienced agents combine local market expertise with cutting-edge technology to serve buyers and sellers effectively. Whether you&apos;re purchasing your first home, selling an investment property, or seeking commercial space, we provide personalized attention and proven results. Our track record includes faster sales, higher prices, and satisfied clients. Contact Premier Properties and discover the difference professional representation makes!',
        'Finding your dream home starts with Premier Properties Realty! Our agents listen carefully to understand your needs, preferences, and budget. We provide access to comprehensive listings including exclusive properties not widely advertised. Virtual tours and detailed information help you preview homes efficiently. When you&apos;re ready to view properties, we coordinate showings at your convenience. Our negotiation expertise ensures you get the best possible price and terms. Let us make your homeownership dreams come true!',
        'Selling your home? Premier Properties Realty maximizes your sale price through strategic marketing and expert negotiation. We begin with professional photography, virtual tours, and compelling property descriptions. Your listing reaches buyers through MLS, online platforms, social media, and our extensive network. Open houses and private showings generate interest and offers. Our agents negotiate skillfully to protect your interests and close deals successfully. List with Premier Properties for results!',
        'First-time homebuyers receive exceptional guidance from Premier Properties Realty! We explain the entire process from pre-qualification through closing. Our mortgage partners provide competitive financing options. We help you understand inspections, appraisals, and contingencies. No question is too small as we educate and empower you. Buying your first home is exciting, and we make it smooth and successful. Start your homeownership journey with Premier Properties!',
        'Investors choose Premier Properties Realty for market insights and profitable opportunities! Our agents identify properties with strong appreciation potential and rental income. We analyze market trends, neighborhood development, and comparable sales. Whether you&apos;re seeking single-family rentals, multi-family buildings, or fix-and-flip projects, we connect you with lucrative investments. Our commercial division assists with retail, office, and industrial properties. Build wealth through real estate with Premier Properties!',
        'Commercial real estate needs require specialized expertise. Premier Properties Realty&apos;s commercial division assists business owners, investors, and developers. We handle office space leasing, retail locations, industrial properties, and land development. Market analysis, site selection, and lease negotiation are our strengths. Understanding zoning, traffic patterns, and demographic trends guides our recommendations. Whether expanding your business or investing in commercial property, trust our commercial team!',
        'Premier Properties Realty uses advanced marketing technology to showcase your property! Professional photography captures your home&apos;s best features. 3D virtual tours let buyers explore remotely. Drone footage highlights property and neighborhood. Video walk-throughs create emotional connections. Social media advertising targets qualified buyers. This comprehensive approach generates maximum exposure and faster sales. Modern marketing delivers old-fashioned results. List with Premier Properties!',
        'Serious homebuyers benefit from mortgage pre-qualification assistance! Premier Properties Realty connects you with trusted lending partners who evaluate your financial situation and provide pre-approval letters. This strengthens your offers and speeds up the buying process. Sellers take pre-qualified buyers seriously. You&apos;ll know your budget clearly and shop confidently. Our team coordinates seamlessly with lenders for smooth transactions. Get pre-qualified and start shopping today!',
        'Local expertise sets Premier Properties Realty apart! Our agents live and work in the communities we serve. We know school ratings, amenities, development plans, and market trends for every neighborhood. This knowledge helps buyers choose the right location and sellers price competitively. We provide detailed neighborhood information, demographic data, and lifestyle insights. Make informed real estate decisions with agents who truly know the area!',
        'Premier Properties Realty offers competitive commission rates without compromising service quality! We believe excellent representation should be accessible to all sellers. Our lower fees mean more money in your pocket at closing. Yet we still provide professional photography, comprehensive marketing, expert negotiation, and white-glove service. Value and excellence aren&apos;t mutually exclusive. Discover how Premier Properties delivers both. List your property today!',
        'Relocating to a new area? Premier Properties Realty&apos;s relocation services make moving stress-free! We provide detailed area information, school research, community resources, and neighborhood tours. Our agents help you understand local culture, amenities, and lifestyle. We coordinate long-distance viewings and handle details remotely when needed. Moving is challenging, but finding the right home and community doesn&apos;t have to be. Let Premier Properties guide your relocation!',
        'Don&apos;t just take our word for it—read what clients say! Premier Properties Realty maintains five-star ratings based on hundreds of satisfied buyers and sellers. Testimonials highlight our responsiveness, expertise, negotiation skills, and dedication. We&apos;re proud that referrals and repeat clients drive our business. When you trust us with your real estate needs, you join a community of happy homeowners. Experience the Premier Properties difference yourself. Contact us today!'
      ],
      description: undefined,
      businessName: "",
      website: "",
      keywords: [],
      keyPoints: [],
      headings: []
    }
  }
];

export function extractBusinessData(url: string): BusinessData {
  // Convert URL to lowercase for matching
  const lowerUrl = url.toLowerCase();

  // Find matching business template based on keywords
  for (const template of BUSINESS_TEMPLATES) {
    for (const keyword of template.keywords) {
      if (lowerUrl.includes(keyword)) {
        return template.data;
      }
    }
  }

  // Default fallback to generic business
  return {
    content: 'This business offers exceptional products and services to customers. Established reputation for quality, customer service, and competitive pricing. Serving the community with dedication and expertise.',
    posts7sec: [
      'Discover exceptional quality and service! This business delivers excellence every time. Experience the difference today!',
      'Customer satisfaction is our top priority. Proven track record of happy clients. Join our community now!',
      'Premium products at competitive prices. Value meets quality here. Shop with confidence!',
      'Expert knowledge and friendly service. We&apos;re here to help you succeed. Contact us today!',
      'Trusted by the community for years. Reliability and quality you can count on. Choose us!',
      'Special offers available now! Don&apos;t miss incredible deals on top products. Shop today!',
      'Personalized attention for every customer. You&apos;re important to us. Experience exceptional care!',
      'Innovation meets tradition. Modern solutions with timeless values. Discover what sets us apart!',
      'Convenient hours and locations serve your needs. Accessibility matters. Visit us today!',
      'Satisfaction guaranteed on every purchase. Confidence in every transaction. Try us risk-free!',
      'Local business, global standards. Community roots, world-class service. Support local excellence!',
      'Free consultations available! Learn more about our offerings. No obligation required!'
    ],
    posts30sec: [
      'Welcome to a business dedicated to your success! We combine years of experience with innovative approaches to deliver exceptional products and services. Our team understands your needs and works tirelessly to exceed your expectations. From initial consultation through final delivery, we provide personalized attention and expert guidance. Competitive pricing ensures you get tremendous value without compromising quality. Discover why customers choose us repeatedly and recommend us enthusiastically!',
      'Quality is our foundation at this exceptional business. We carefully select premium products and maintain rigorous standards throughout our operations. Every team member commits to excellence in service and expertise. This dedication to quality translates into superior results for our customers. Whether you&apos;re a first-time visitor or loyal client, you&apos;ll experience the difference that genuine quality makes. Trust us with your needs today!',
      'Customer service excellence defines everything we do. Our knowledgeable team listens carefully, answers questions thoroughly, and provides solutions tailored to your specific situation. We believe in building lasting relationships, not just completing transactions. Follow-up support ensures your continued satisfaction long after your initial purchase. Join thousands of happy customers who appreciate our commitment to exceptional service. Experience the difference today!',
      'Innovation drives our business forward while respecting proven traditions. We embrace new technologies and techniques that improve outcomes for customers. At the same time, we maintain the core values of honesty, integrity, and hard work. This balance creates a unique advantage you won&apos;t find elsewhere. Whether you need cutting-edge solutions or time-tested approaches, we deliver both expertly!',
      'Convenience matters in today&apos;s busy world. That&apos;s why we offer extended hours, multiple locations, and online services to fit your schedule. Easy ordering, fast delivery, and flexible payment options make doing business with us simple and stress-free. We remove obstacles and streamline processes so you can focus on what matters most. Experience unprecedented convenience today!',
      'Value means more than low prices—it means getting the most for your investment. We deliver exceptional quality at fair, competitive prices. No hidden fees, surprise charges, or fine print tricks. Transparent pricing builds trust. Special promotions and loyalty programs provide additional savings for our valued customers. Discover true value here!',
      'Local roots give us deep understanding of community needs. We employ your neighbors, support local causes, and invest in our shared home. This connection drives our commitment to exceptional service. When you choose us, you&apos;re supporting local jobs and strengthening community bonds. Shop local, get global quality!',
      'Expertise matters when making important decisions. Our team brings extensive knowledge and proven experience to every customer interaction. We stay current through ongoing training and professional development. This expertise helps you avoid costly mistakes and achieve better outcomes. Trust professionals who know their field inside and out!',
      'Satisfaction guaranteed—that&apos;s our promise to every customer! We stand behind our products and services completely. If you&apos;re not delighted, we make it right. This guarantee gives you confidence to try our offerings risk-free. We succeed only when you&apos;re satisfied. Experience worry-free shopping today!',
      'Special promotions happening now! For a limited time, enjoy incredible savings on our most popular products and services. These exclusive deals won&apos;t last long. Whether you&apos;re a new customer or loyal client, everyone saves during this special event. Don&apos;t miss out—shop today while supplies last!',
      'Personalized service sets us apart from competitors. We never treat you like just another number. Your unique needs, preferences, and goals guide our recommendations. One-on-one consultations ensure perfect matches between products and requirements. This attention to individual needs creates superior outcomes and lasting satisfaction. Experience truly personal service!',
      'Ready to get started? Contact us today for a free, no-obligation consultation! We&apos;ll discuss your needs, answer questions, and explain how we can help. There&apos;s no pressure, just honest information to help you make the best decision. Reaching out is easy—call, email, or visit us. We look forward to serving you!'
    ],
    description: undefined,
    businessName: "",
    website: "",
    keywords: [],
    keyPoints: [],
    headings: [],
  }
}
