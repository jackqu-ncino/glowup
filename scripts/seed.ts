import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// --- DATA ---

const CITIES = [
  { city: "Austin", state: "TX", zip: "78701", lat: 30.2672, lng: -97.7431 },
  { city: "Austin", state: "TX", zip: "78704", lat: 30.2437, lng: -97.7569 },
  { city: "Austin", state: "TX", zip: "78745", lat: 30.1907, lng: -97.7972 },
  { city: "Austin", state: "TX", zip: "78702", lat: 30.2622, lng: -97.7219 },
  { city: "Austin", state: "TX", zip: "78731", lat: 30.3588, lng: -97.7722 },
  { city: "Round Rock", state: "TX", zip: "78664", lat: 30.5083, lng: -97.6789 },
  { city: "Cedar Park", state: "TX", zip: "78613", lat: 30.505, lng: -97.8203 },
  { city: "San Marcos", state: "TX", zip: "78666", lat: 29.8833, lng: -97.9414 },
  { city: "New York", state: "NY", zip: "10001", lat: 40.7484, lng: -73.9967 },
  { city: "New York", state: "NY", zip: "10003", lat: 40.7317, lng: -73.9893 },
  { city: "Brooklyn", state: "NY", zip: "11201", lat: 40.6936, lng: -73.9897 },
  { city: "Brooklyn", state: "NY", zip: "11215", lat: 40.6688, lng: -73.9864 },
  { city: "Queens", state: "NY", zip: "11101", lat: 40.7433, lng: -73.923 },
  { city: "Los Angeles", state: "CA", zip: "90001", lat: 33.9425, lng: -118.2551 },
  { city: "Los Angeles", state: "CA", zip: "90028", lat: 34.0983, lng: -118.3267 },
  { city: "Los Angeles", state: "CA", zip: "90046", lat: 34.1133, lng: -118.3694 },
  { city: "Santa Monica", state: "CA", zip: "90401", lat: 34.0195, lng: -118.4912 },
  { city: "Chicago", state: "IL", zip: "60601", lat: 41.8819, lng: -87.6278 },
  { city: "Chicago", state: "IL", zip: "60614", lat: 41.9218, lng: -87.6496 },
  { city: "Chicago", state: "IL", zip: "60657", lat: 41.9402, lng: -87.6532 },
  { city: "Miami", state: "FL", zip: "33101", lat: 25.7617, lng: -80.1918 },
  { city: "Miami", state: "FL", zip: "33139", lat: 25.7907, lng: -80.1342 },
  { city: "Houston", state: "TX", zip: "77001", lat: 29.7604, lng: -95.3698 },
  { city: "Houston", state: "TX", zip: "77006", lat: 29.7439, lng: -95.3862 },
  { city: "Atlanta", state: "GA", zip: "30301", lat: 33.749, lng: -84.388 },
  { city: "Atlanta", state: "GA", zip: "30306", lat: 33.7838, lng: -84.3498 },
  { city: "Dallas", state: "TX", zip: "75201", lat: 32.7887, lng: -96.7987 },
  { city: "Phoenix", state: "AZ", zip: "85001", lat: 33.4484, lng: -112.074 },
  { city: "Denver", state: "CO", zip: "80201", lat: 39.7392, lng: -104.9903 },
  { city: "Seattle", state: "WA", zip: "98101", lat: 47.6062, lng: -122.3321 },
];

const PROVIDER_NAMES = [
  "Aaliyah Johnson", "Brianna Tran", "Carmen Rodriguez", "Destiny Williams",
  "Elena Kowalski", "Fatima Hassan", "Grace Kim", "Hannah Okafor",
  "Isabella Martinez", "Jade Thompson", "Keisha Brown", "Luna Nguyen",
  "Maya Patel", "Nia Jackson", "Olivia Chen", "Priya Sharma",
  "Quinn Rivera", "Rosa Hernandez", "Samira Ali", "Tanya Morrison",
  "Uma Reddy", "Valentina Lopez", "Willow Park", "Xiomara Reyes",
  "Yara Bakari", "Zoe Dubois", "Anika Foster", "Bianca Taylor",
  "Crystal Washington", "Diana Lee",
];

const BUSINESS_NAMES = [
  "Nails by Aaliyah", "Bri's Beauty Bar", null, "Destiny's Hair Studio",
  "Elena's Lash Lounge", null, "Grace Glow Studio", null,
  "Bella Beauty Co.", "Jade's Brow Bar", "Keisha's Kuts", "Luna Nails & Spa",
  "Maya's Makeup Artistry", null, "Olive & Glow Skincare", "Priya's Threading",
  null, "Rosa's Beauty Parlor", "Samira Styles", null,
  null, "Val's Vanity", "Willow Wellness", null,
  "Yara Beauty", "Zoe's Skin Studio", null, "Bianca's Blowout Bar",
  "Crystal Clear Skin", "Diana's Lash & Brow",
];

const BIOS = [
  "Passionate nail artist with 5+ years of experience. Specializing in gel extensions and nail art.",
  "Licensed cosmetologist bringing salon-quality hair services to your doorstep.",
  "Self-taught lash artist turned full-time beauty provider. I love making people feel confident!",
  "Award-winning hair stylist specializing in natural hair and protective styles.",
  "Certified lash technician with a focus on volume and hybrid sets.",
  "Bringing the spa experience to you. Skincare enthusiast and licensed esthetician.",
  "Korean beauty inspired skincare and makeup services. 8 years in the industry.",
  "Brow specialist and threading expert. Trained in India, now serving the community here.",
  "Full-service makeup artist for events, weddings, and everyday glam.",
  "Master barber and men's grooming specialist. Fade king since 2018.",
  "Celebrity-inspired hairstylist. I bring the red carpet look to your living room.",
  "Gel nail queen. Known for my custom designs and long-lasting sets.",
  "Licensed esthetician with a holistic approach to skincare. Clean beauty advocate.",
  "Specializing in balayage, highlights, and color correction. Your hair transformation awaits!",
  "Waxing specialist — quick, clean, and virtually painless. Brazilian wax expert.",
];

const SERVICE_TEMPLATES: Record<string, { name: string; priceMin: number; priceMax: number | null; duration: number }[]> = {
  hair: [
    { name: "Women's Haircut", priceMin: 45, priceMax: 85, duration: 60 },
    { name: "Blowout & Style", priceMin: 35, priceMax: 55, duration: 45 },
    { name: "Balayage", priceMin: 150, priceMax: 250, duration: 180 },
    { name: "Full Color", priceMin: 80, priceMax: 150, duration: 120 },
    { name: "Deep Conditioning Treatment", priceMin: 25, priceMax: 45, duration: 30 },
    { name: "Braids / Protective Styles", priceMin: 100, priceMax: 300, duration: 240 },
  ],
  nails: [
    { name: "Classic Manicure", priceMin: 25, priceMax: 35, duration: 30 },
    { name: "Gel Manicure", priceMin: 40, priceMax: 55, duration: 45 },
    { name: "Acrylic Full Set", priceMin: 50, priceMax: 80, duration: 75 },
    { name: "Nail Art (per nail)", priceMin: 5, priceMax: 15, duration: 10 },
    { name: "Pedicure", priceMin: 35, priceMax: 55, duration: 45 },
    { name: "Gel Extensions", priceMin: 65, priceMax: 100, duration: 90 },
  ],
  brows: [
    { name: "Brow Shaping (Wax)", priceMin: 15, priceMax: 25, duration: 15 },
    { name: "Brow Threading", priceMin: 12, priceMax: 20, duration: 15 },
    { name: "Brow Tint", priceMin: 20, priceMax: 30, duration: 20 },
    { name: "Brow Lamination", priceMin: 55, priceMax: 75, duration: 45 },
    { name: "Henna Brows", priceMin: 40, priceMax: 60, duration: 30 },
  ],
  lashes: [
    { name: "Classic Lash Set", priceMin: 80, priceMax: 120, duration: 90 },
    { name: "Volume Lash Set", priceMin: 120, priceMax: 180, duration: 120 },
    { name: "Hybrid Lash Set", priceMin: 100, priceMax: 150, duration: 105 },
    { name: "Lash Fill (2 weeks)", priceMin: 55, priceMax: 80, duration: 60 },
    { name: "Lash Removal", priceMin: 25, priceMax: null, duration: 30 },
  ],
  makeup: [
    { name: "Full Glam Makeup", priceMin: 75, priceMax: 125, duration: 60 },
    { name: "Bridal Makeup", priceMin: 150, priceMax: 300, duration: 90 },
    { name: "Natural / Everyday Look", priceMin: 50, priceMax: 75, duration: 45 },
    { name: "Makeup Lesson", priceMin: 80, priceMax: 120, duration: 60 },
  ],
  skincare: [
    { name: "Basic Facial", priceMin: 60, priceMax: 85, duration: 60 },
    { name: "Hydrafacial", priceMin: 150, priceMax: 200, duration: 60 },
    { name: "Chemical Peel", priceMin: 100, priceMax: 175, duration: 45 },
    { name: "Microdermabrasion", priceMin: 100, priceMax: 150, duration: 45 },
  ],
  waxing: [
    { name: "Brazilian Wax", priceMin: 50, priceMax: 70, duration: 30 },
    { name: "Bikini Wax", priceMin: 35, priceMax: 50, duration: 20 },
    { name: "Full Leg Wax", priceMin: 55, priceMax: 75, duration: 45 },
    { name: "Underarm Wax", priceMin: 15, priceMax: 25, duration: 15 },
  ],
  barbering: [
    { name: "Men's Haircut", priceMin: 25, priceMax: 40, duration: 30 },
    { name: "Fade", priceMin: 30, priceMax: 45, duration: 35 },
    { name: "Beard Trim & Shape", priceMin: 15, priceMax: 25, duration: 20 },
    { name: "Hot Towel Shave", priceMin: 30, priceMax: 45, duration: 30 },
  ],
};

const CUSTOMER_NAMES = [
  "Alex Morgan", "Blake Harper", "Casey Jordan", "Drew Ellis", "Emery Brooks",
  "Finley James", "Gray Mitchell", "Harper Quinn", "Indigo West", "Jules Avery",
  "Kai Reeves", "Lane Collins", "Morgan Blake", "Noel Hart", "Oakley Simone",
  "Parker Sage", "Reese Monroe", "Sage Wilder", "Taylor Banks", "Winter Hayes",
  "Avery Stone", "Blair Kennedy", "Cameron Cruz", "Dakota Lane", "Eden Fox",
  "Frankie Voss", "Hayden Clark", "Jamie Porter", "Kendall Royce", "Logan Frost",
  "Marley Webb", "Nico Duval", "Peyton Wolfe", "Riley Storm", "Skyler Nash",
  "Tatum Hale", "Valentine Cruz", "Wren Bishop", "Zion Grant", "Ashton Cole",
  "Bellamy Knox", "Charlie Vaughn", "Devin Lark", "Ellis York", "Flynn Sage",
  "Greer Atlas", "Hollis Maeve", "Ivy Callahan", "Jesse Noor", "Kit Farrow",
];

const REVIEW_COMMENTS = [
  "Absolutely amazing! My nails have never looked better.",
  "So talented and professional. I'm a client for life!",
  "The best lash set I've ever had. Will definitely be back.",
  "Loved the experience! She made me feel so comfortable.",
  "Great attention to detail. Exactly what I asked for.",
  "My hair looks incredible! Got so many compliments.",
  "Very clean workspace and uses quality products.",
  "She really listens to what you want. Highly recommend!",
  "Affordable prices for amazing quality work.",
  "I've been looking for someone like this in my area forever!",
  "Perfect brows every single time. Don't go anywhere else.",
  "The whole experience was relaxing and the results are beautiful.",
  "Quick, professional, and the results speak for themselves.",
  "My skin has never felt so good. The facial was life-changing.",
  "So friendly and welcoming. Made me feel right at home.",
  null, null, null, null, null, // Some reviews with no comment
];

const LOCATION_TYPES = ["home_studio", "separate_studio", "mobile"] as const;

// --- HELPERS ---

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Jitter lat/lng slightly so markers don't stack
function jitter(val: number, range = 0.02): number {
  return val + (Math.random() - 0.5) * range;
}

// --- MAIN ---

async function seed() {
  console.log("Loading reference data...");

  const { data: categories } = await supabase.from("categories").select("*");
  const { data: tags } = await supabase.from("tags").select("*");
  const { data: paymentMethods } = await supabase.from("payment_methods").select("*");

  if (!categories || !tags || !paymentMethods) {
    console.error("Missing reference data. Run 002_seed_data.sql first.");
    process.exit(1);
  }

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // ========== CREATE PROVIDERS ==========
  console.log("Creating 30 providers...");

  const providerUserIds: string[] = [];
  const providerProfileIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const name = PROVIDER_NAMES[i];
    const email = `provider${i + 1}@glowup-demo.com`;
    const loc = CITIES[i];
    const avatarSeed = name.replace(/\s/g, "");

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "DemoPass123!",
      email_confirm: true,
      user_metadata: { full_name: name, user_type: "provider" },
    });

    if (authError) {
      console.error(`Failed to create provider ${name}:`, authError.message);
      continue;
    }

    const userId = authUser.user.id;
    providerUserIds.push(userId);

    // Update avatar
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=ffd5dc,c0aede,b6e3f4`;
    await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", userId);

    // Create provider profile
    const locType = pick(LOCATION_TYPES);
    const { data: profile } = await supabase
      .from("provider_profiles")
      .insert({
        user_id: userId,
        business_name: BUSINESS_NAMES[i],
        bio: BIOS[i % BIOS.length],
        zip_code: loc.zip,
        city: loc.city,
        state: loc.state,
        location: `SRID=4326;POINT(${jitter(loc.lng)} ${jitter(loc.lat)})`,
        service_radius_miles: pick([10, 15, 20, 25]),
        location_type: locType,
        instagram_url: `https://instagram.com/${avatarSeed.toLowerCase()}`,
        tiktok_url: Math.random() > 0.5 ? `https://tiktok.com/@${avatarSeed.toLowerCase()}` : null,
        facebook_url: Math.random() > 0.7 ? `https://facebook.com/${avatarSeed.toLowerCase()}` : null,
        is_published: true,
        onboarding_completed: true,
      })
      .select("id")
      .single();

    if (!profile) continue;
    providerProfileIds.push(profile.id);

    // Assign 1-3 categories
    const numCats = rand(1, 3);
    const providerCats = pickN(categories, numCats);
    await supabase.from("provider_categories").insert(
      providerCats.map((c) => ({ profile_id: profile.id, category_id: c.id }))
    );

    // Assign 0-3 tags
    const numTags = rand(0, 3);
    if (numTags > 0) {
      const providerTags = pickN(tags, numTags);
      await supabase.from("provider_tags").insert(
        providerTags.map((t) => ({ profile_id: profile.id, tag_id: t.id }))
      );
    }

    // Assign 2-4 payment methods
    const numPms = rand(2, 4);
    const providerPms = pickN(paymentMethods, numPms);
    await supabase.from("provider_payment_methods").insert(
      providerPms.map((p) => ({ profile_id: profile.id, payment_method_id: p.id }))
    );

    // Add services for each assigned category
    let serviceOrder = 0;
    for (const cat of providerCats) {
      const templates = SERVICE_TEMPLATES[cat.slug] || [];
      const numServices = rand(2, Math.min(4, templates.length));
      const selectedServices = pickN(templates, numServices);

      for (const svc of selectedServices) {
        await supabase.from("services").insert({
          profile_id: profile.id,
          category_id: cat.id,
          name: svc.name,
          price_min: svc.priceMin,
          price_max: svc.priceMax,
          duration_minutes: svc.duration,
          display_order: serviceOrder++,
        });
      }
    }

    console.log(`  ✓ ${name} (${loc.city}, ${loc.state})`);
  }

  // ========== CREATE CUSTOMERS ==========
  console.log("\nCreating 50 customers...");

  const customerUserIds: string[] = [];

  for (let i = 0; i < 50; i++) {
    const name = CUSTOMER_NAMES[i];
    const email = `customer${i + 1}@glowup-demo.com`;
    const avatarSeed = name.replace(/\s/g, "");

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "DemoPass123!",
      email_confirm: true,
      user_metadata: { full_name: name, user_type: "customer" },
    });

    if (authError) {
      console.error(`Failed to create customer ${name}:`, authError.message);
      continue;
    }

    customerUserIds.push(authUser.user.id);

    // Update avatar
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=ffd5dc,c0aede,b6e3f4`;
    await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", authUser.user.id);

    if ((i + 1) % 10 === 0) console.log(`  ✓ ${i + 1} customers created`);
  }

  // ========== CREATE REVIEWS ==========
  console.log("\nCreating reviews...");

  let reviewCount = 0;
  for (let pi = 0; pi < providerProfileIds.length; pi++) {
    const profileId = providerProfileIds[pi];
    const numReviews = rand(2, 8);
    const reviewers = pickN(customerUserIds, numReviews);

    for (const reviewerId of reviewers) {
      const rating = pick([3, 4, 4, 4, 5, 5, 5, 5, 5]); // skewed positive
      const comment = pick(REVIEW_COMMENTS);

      const { error } = await supabase.from("reviews").insert({
        provider_profile_id: profileId,
        reviewer_id: reviewerId,
        rating,
        comment,
      });

      if (!error) reviewCount++;
    }
  }
  console.log(`  ✓ ${reviewCount} reviews created`);

  // ========== CREATE CONVERSATIONS & MESSAGES ==========
  console.log("\nCreating conversations and messages...");

  let convCount = 0;
  let msgCount = 0;

  const MESSAGE_PAIRS = [
    ["Hi! I'd love to book a session. Are you available this weekend?", "Hey! Yes, I have openings Saturday afternoon. What service are you looking for?"],
    ["Do you do gel extensions?", "Absolutely! That's one of my specialties. Would you like to see some examples of my work?"],
    ["How far in advance do I need to book?", "I usually recommend at least 3-4 days in advance, but I sometimes have same-week availability!"],
    ["What's your cancellation policy?", "I ask for at least 24 hours notice. Life happens though, so just let me know as soon as you can!"],
    ["Love your portfolio! Can you do something similar to what you posted on Instagram?", "Thank you so much! Absolutely, bring a screenshot and we'll make it happen!"],
    ["Is parking easy at your studio?", "Yes! There's free street parking right out front and a small lot behind the building."],
    ["Do you offer any first-time client discounts?", "Welcome! I offer 15% off your first visit. Just mention it when you come in!"],
  ];

  // Create ~20 conversations
  for (let c = 0; c < 20; c++) {
    const customerId = pick(customerUserIds);
    const providerIdx = c % providerUserIds.length;
    const providerId = providerUserIds[providerIdx];

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({ customer_id: customerId, provider_id: providerId })
      .select("id")
      .single();

    if (convError || !conv) continue;
    convCount++;

    const pair = pick(MESSAGE_PAIRS);
    // Customer sends first message
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: customerId,
      content: pair[0],
      is_read: true,
    });
    msgCount++;

    // Provider replies
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: providerId,
      content: pair[1],
      is_read: Math.random() > 0.3,
    });
    msgCount++;

    // Sometimes add a third message
    if (Math.random() > 0.5) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: customerId,
        content: pick(["Sounds great!", "Perfect, I'll book soon!", "Thank you so much!", "Can't wait!", "Awesome, see you then!"]),
        is_read: false,
      });
      msgCount++;
    }
  }

  console.log(`  ✓ ${convCount} conversations, ${msgCount} messages`);

  // ========== DONE ==========
  console.log("\n✅ Seeding complete!");
  console.log(`   30 providers, 50 customers, ${reviewCount} reviews, ${convCount} conversations`);
  console.log("\n   Demo login: any provider/customer email with password 'DemoPass123!'");
  console.log("   Example: provider1@glowup-demo.com / DemoPass123!");
  console.log("   Example: customer1@glowup-demo.com / DemoPass123!");
  console.log("\n   Search zip codes to try: 78701 (Austin), 10001 (NYC), 90001 (LA), 60601 (Chicago)");
}

seed().catch(console.error);
