-- Fix political parties bilingual names
UPDATE political_parties SET name_en = 'Bangladesh Awami League' WHERE name_bn = 'বাংলাদেশ আওয়ামী লীগ';
UPDATE political_parties SET name_bn = 'বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)' WHERE name_en = 'Bangladesh Nationalist Party (BNP)';
UPDATE political_parties SET name_en = 'Jatiya Party' WHERE name_bn = 'জাতীয় পার্টি';
UPDATE political_parties SET name_en = 'Independent' WHERE name_bn = 'স্বতন্ত্র';
UPDATE political_parties SET name_en = 'Bangladesh Nationalist Party (BNP)' WHERE name_bn = 'বাংলাদেশ জাতীয়তাবাদী দল (বি.এন.পি)';
UPDATE political_parties SET name_en = 'Bangladesh Jamaat-E-Islami' WHERE name_bn = 'বাংলাদেশ জামায়াতে ইসলামী';
UPDATE political_parties SET name_en = 'National Citizens Party (NCP)' WHERE name_bn = 'জাতীয় নাগরিক পার্টি-এনসিপি';
UPDATE political_parties SET name_en = 'Bangladesh National Party (BJP)' WHERE name_bn = 'বাংলাদেশ জাতীয় পার্টি-বিজেপি';
SELECT id, name_en, name_bn FROM political_parties ORDER BY id;
