-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO "public"."user" ("id", "name", "email", "email_verified", "image", "date_of_birth", "gender", "phone_number", "created_at", "updated_at") VALUES
	('Kc9KgU8b0Rl5xFZRs1u5ItQ8Hm4wXnNQ', 'Batman', 'pubgmerabeta10@gmail.com', true, 'https://lh3.googleusercontent.com/a/ACg8ocIJR429uVDHc5ZyAI_JnH3oHZUe5HIIJLuVgKIQrZwa2CjqdQ=s96-c', NULL, NULL, NULL, '2026-02-06 04:09:15.529', '2026-02-06 04:09:15.529'),
	('LJFesUizlJcF4IntcYMzQLRqxPioRQwt', 'ff five', 'fffive87@gmail.com', true, 'https://lh3.googleusercontent.com/a/ACg8ocIBPFSxm-5Dz8WwIs6gvoJ47emTHzcmIyMv3ivCzBfrGcqZXg=s96-c', NULL, NULL, NULL, '2026-02-07 12:45:31.283', '2026-02-07 12:45:31.283')
    ON CONFLICT ("id") DO NOTHING;

-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO "public"."categories" ("id", "name", "slug", "icon", "parent_id", "created_at", "updated_at") VALUES
	(1, 'Fashion & Apparel', 'fashion-apparel', 'Shirt', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(2, 'Electronics', 'electronics', 'Smartphone', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(3, 'Home & Living', 'home-living', 'Home', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(4, 'Beauty & Personal Care', 'beauty-personal-care', 'Sparkles', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(5, 'Sports & Outdoors', 'sports-outdoors', 'Dumbbell', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(6, 'Food & Beverages', 'food-beverages', 'UtensilsCrossed', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(7, 'Industrial Supplies', 'industrial-supplies', 'Factory', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(8, 'Office & Stationery', 'office-stationery', 'Briefcase', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(9, 'Packaging', 'packaging', 'Package', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(10, 'Raw Materials', 'raw-materials', 'Boxes', NULL, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(11, 'Men''s Clothing', 'mens-clothing', 'Shirt', 1, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(12, 'Women''s Clothing', 'womens-clothing', 'Shirt', 1, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(13, 'Mobile Accessories', 'mobile-accessories', 'Smartphone', 2, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(14, 'Computer Parts', 'computer-parts', 'Monitor', 2, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(15, 'Kitchen & Dining', 'kitchen-dining', 'UtensilsCrossed', 3, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193'),
	(16, 'Furniture', 'furniture', 'Sofa', 3, '2026-02-08 06:22:26.141193', '2026-02-08 06:22:26.141193')
    ON CONFLICT ("id") DO NOTHING;

-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO "public"."suppliers" ("id", "name", "slug", "logo", "verified", "location", "response_rate", "on_time_delivery", "years_in_business", "description", "created_at", "updated_at", "owner_id") VALUES
	(1, 'Grant, Farrell and Lubowitz', 'kassulke-wuckert-and-paucek', 'https://picsum.photos/seed/supplier1/200/200', true, 'Narayanganj', 80.30, 94.60, 9, 'Balanced full-range policy', '2026-02-08 06:22:26.150767', '2026-02-08 06:22:26.150767', NULL),
	(2, 'Daniel - Lemke', 'nicolas-and-sons', 'https://picsum.photos/seed/supplier2/200/200', false, 'Rajshahi', 91.70, 86.40, 8, 'Ergonomic dynamic middleware', '2026-02-08 06:22:26.150767', '2026-02-08 06:22:26.150767', NULL),
	(21, 'ayojon', 'ayojon-f62eda30', NULL, true, 'Ctg', 0.00, 0.00, 2, 'Hello', '2026-02-08 18:17:48.905499', '2026-02-08 18:17:48.905499', 'Kc9KgU8b0Rl5xFZRs1u5ItQ8Hm4wXnNQ')
    ON CONFLICT ("id") DO NOTHING;

-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO "public"."admins" ("id", "email", "password", "name", "role", "avatar", "is_active", "last_login_at", "created_at", "updated_at") VALUES
	('9862ce75-5d76-46b5-9077-ca5b12b1aa4a', 'admin@borobepari.com', '27dc1f5c67bdf1d2bf661095e1cc5a22123348588da2e2160a8ca0af138ab7a5', 'Super Admin', 'super_admin', NULL, true, '2026-02-08 18:36:50.592', '2026-02-05 19:28:04.373971', '2026-02-05 19:28:04.373971')
    ON CONFLICT ("id") DO NOTHING;

-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO "public"."sellers" ("id", "email", "password", "business_name", "business_type", "trade_license_number", "business_category", "years_in_business", "full_name", "phone", "address", "city", "postal_code", "bank_name", "account_holder_name", "account_number", "branch_name", "routing_number", "email_verified", "kyc_status", "kyc_submitted_at", "kyc_rejection_reason", "kyc_documents", "kyc_additional_info", "verification_badge", "supplier_id", "created_at", "updated_at") VALUES
	('983ad445-c185-4e8b-a91b-e0095bb38928', 'pubgmerabeta10@gmail.com', '5a20bf129b331b46cd9771dcfde7bd70571250821b89cac7f813d5dd9ffda0fd', 'ayojon', 'Wholesaler', '0101010101001', 'Industrial Supplies', 2, 'KamaL', '01724324560', 'Kotowali', 'Ctg', '4000', 'Eastern Bank', 'Kamal', '0101010101010', 'Dhaka', '2', true, 'approved', '2026-02-08 11:23:52.339', NULL, '{}', '{"categories": ["Home & Kitchen", "Industrial Supplies"], "description": "Hello", "inventoryRange": "Below ৳50,000"}', 'verified', 21, '2026-02-08 11:22:45.417364', '2026-02-08 18:17:48.915')
    ON CONFLICT ("id") DO NOTHING;

SELECT pg_catalog.setval('"public"."categories_id_seq"', 16, true);
SELECT pg_catalog.setval('"public"."suppliers_id_seq"', 21, true);
