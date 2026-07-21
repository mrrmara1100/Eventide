// Seed data for the mock backend. Mirrors the seeders that will later live in
// Laravel's database/seeders — same columns, same enum values as the schema in
// the project proposal (section 3).

export const CATEGORIES = [
  'Technology',
  'Music',
  'Business',
  'Art & Culture',
  'Sports',
]

// Dates are generated relative to today so the listing never goes stale.
const daysFromNow = (days, hour = 19) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const seedUsers = [
  {
    id: 1,
    name: 'Mara Chen',
    email: 'organizer@eventide.test',
    password: 'password',
    role: 'organizer',
  },
  {
    id: 2,
    name: 'Sam Rivera',
    email: 'attendee@eventide.test',
    password: 'password',
    role: 'attendee',
  },
]

export const seedEvents = [
  {
    id: 1,
    organizer_id: 1,
    title: 'React Summit 2026',
    description:
      'A full day of talks on React 19, server components, and the future of the component model. Speakers from across the ecosystem cover performance, state management, and shipping SPAs that stay maintainable past year one.',
    venue: 'Innovation Hub, Hall A',
    date_time: daysFromNow(14, 9),
    category: 'Technology',
    capacity: 300,
    status: 'published',
  },
  {
    id: 2,
    organizer_id: 1,
    title: 'Midnight Strings — Live',
    description:
      'An intimate acoustic set from four touring artists, performed in the round. Doors open an hour early for the vinyl market in the foyer.',
    venue: 'The Old Warehouse',
    date_time: daysFromNow(9, 20),
    category: 'Music',
    capacity: 180,
    status: 'published',
  },
  {
    id: 3,
    organizer_id: 1,
    title: 'Founders Breakfast: Raising Your Seed',
    description:
      'Three founders and one VC break down what actually happened in their seed rounds — the numbers, the rejections, and the terms they wish they had pushed back on.',
    venue: 'Riverside Conference Centre',
    date_time: daysFromNow(5, 8),
    category: 'Business',
    capacity: 80,
    status: 'published',
  },
  {
    id: 4,
    organizer_id: 1,
    title: 'Nightfall: A Group Exhibition',
    description:
      'Twelve emerging artists respond to the theme of dusk across painting, textile, and projection. Opening night includes a curator-led walkthrough.',
    venue: 'Meridian Gallery',
    date_time: daysFromNow(21, 18),
    category: 'Art & Culture',
    capacity: 120,
    status: 'published',
  },
  {
    id: 5,
    organizer_id: 1,
    title: 'City Half Marathon',
    description:
      'A flat, fast course through the old town and along the river. Chip timing, four hydration stations, and a finish-line festival with food trucks.',
    venue: 'Central Park Start Line',
    date_time: daysFromNow(35, 7),
    category: 'Sports',
    capacity: 500,
    status: 'published',
  },
  {
    id: 6,
    organizer_id: 1,
    title: 'Laravel in Production',
    description:
      'A hands-on evening workshop: queues, horizon, database tuning, and the deployment mistakes that only show up under real traffic. Bring a laptop.',
    venue: 'Innovation Hub, Room 2',
    date_time: daysFromNow(28, 18),
    category: 'Technology',
    capacity: 60,
    status: 'published',
  },
  {
    id: 7,
    organizer_id: 1,
    title: 'Synthwave Sessions',
    description:
      'Four DJs, one long night, and a room full of analogue gear. Late licence until 3am.',
    venue: 'Basement 42',
    date_time: daysFromNow(3, 22),
    category: 'Music',
    capacity: 250,
    status: 'published',
  },
  {
    id: 8,
    organizer_id: 1,
    title: 'Design Systems Masterclass',
    description:
      'Build a token-driven design system from scratch and learn how to keep it alive once three teams depend on it.',
    venue: 'Meridian Gallery, Studio 3',
    date_time: daysFromNow(17, 10),
    category: 'Art & Culture',
    capacity: 40,
    status: 'published',
  },
  {
    id: 9,
    organizer_id: 1,
    title: 'Sunrise Yoga on the Pier',
    description:
      'A gentle 60-minute flow as the sun comes up over the water. All levels welcome; mats provided.',
    venue: 'East Pier',
    date_time: daysFromNow(7, 6),
    category: 'Sports',
    capacity: 45,
    status: 'published',
  },
  {
    id: 10,
    organizer_id: 1,
    title: 'Scaling Your First Team',
    description:
      'What changes when you go from five people to fifty: hiring loops, the first layer of management, and the culture debt you accrue on the way.',
    venue: 'Riverside Conference Centre',
    date_time: daysFromNow(42, 13),
    category: 'Business',
    capacity: 150,
    status: 'published',
  },
  {
    id: 11,
    organizer_id: 1,
    title: 'AI Engineering Deep Dive',
    description:
      'Retrieval, evaluation, and the unglamorous work of making a model behave in production. Case studies from three shipped products.',
    venue: 'Innovation Hub, Hall B',
    date_time: daysFromNow(24, 9),
    category: 'Technology',
    capacity: 200,
    status: 'published',
  },
  {
    id: 12,
    organizer_id: 1,
    title: 'Jazz & Supper Club',
    description:
      'A five-piece house band, a three-course menu, and table seating for the whole evening.',
    venue: 'The Conservatory',
    date_time: daysFromNow(12, 19),
    category: 'Music',
    capacity: 90,
    status: 'published',
  },
  {
    id: 13,
    organizer_id: 1,
    title: 'Winter Product Retreat',
    description:
      'Still shaping the agenda for this one — a two-day offsite for product and engineering leads.',
    venue: 'Lakeside Lodge',
    date_time: daysFromNow(90, 9),
    category: 'Business',
    capacity: 30,
    status: 'draft',
  },
]

// One or two tiers per event, per the proposal's "General / VIP" example.
export const seedTicketTypes = [
  { id: 1, event_id: 1, name: 'General Admission', price: 49.0, quantity_available: 220 },
  { id: 2, event_id: 1, name: 'VIP', price: 149.0, quantity_available: 80 },
  { id: 3, event_id: 2, name: 'Standing', price: 25.0, quantity_available: 140 },
  { id: 4, event_id: 2, name: 'Seated Balcony', price: 40.0, quantity_available: 40 },
  { id: 5, event_id: 3, name: 'General Admission', price: 0.0, quantity_available: 80 },
  { id: 6, event_id: 4, name: 'Opening Night', price: 15.0, quantity_available: 120 },
  { id: 7, event_id: 5, name: 'Runner Entry', price: 35.0, quantity_available: 450 },
  { id: 8, event_id: 5, name: 'Charity Entry', price: 60.0, quantity_available: 50 },
  { id: 9, event_id: 6, name: 'Workshop Seat', price: 89.0, quantity_available: 60 },
  { id: 10, event_id: 7, name: 'Early Bird', price: 18.0, quantity_available: 100 },
  { id: 11, event_id: 7, name: 'Standard', price: 28.0, quantity_available: 150 },
  { id: 12, event_id: 8, name: 'Studio Seat', price: 120.0, quantity_available: 40 },
  { id: 13, event_id: 9, name: 'Drop-in', price: 0.0, quantity_available: 45 },
  { id: 14, event_id: 10, name: 'General Admission', price: 45.0, quantity_available: 120 },
  { id: 15, event_id: 10, name: 'VIP', price: 95.0, quantity_available: 30 },
  { id: 16, event_id: 11, name: 'General Admission', price: 79.0, quantity_available: 160 },
  { id: 17, event_id: 11, name: 'VIP', price: 199.0, quantity_available: 40 },
  { id: 18, event_id: 12, name: 'Dinner & Show', price: 85.0, quantity_available: 90 },
  { id: 19, event_id: 13, name: 'Team Seat', price: 0.0, quantity_available: 30 },
]

// A couple of existing bookings so the attendee dashboard is not empty on first run.
export const seedBookings = [
  {
    id: 1,
    user_id: 2,
    ticket_type_id: 3,
    quantity: 2,
    qr_token: '8f14e45f-ceea-467a-9a1b-2d3c4e5f6a7b',
    status: 'confirmed',
  },
  {
    id: 2,
    user_id: 2,
    ticket_type_id: 5,
    quantity: 1,
    qr_token: 'c9f0f895-fb98-4b1e-9c1d-8e7f6a5b4c3d',
    status: 'checked_in',
  },
]
