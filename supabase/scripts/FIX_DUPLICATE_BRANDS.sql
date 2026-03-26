
-- ========================================================
-- CLEANUP: MERGE DUPLICATE BRANDS
-- ========================================================

-- This script merges historical duplicates into the correct brand names
-- It updates products to point to the correct ID and deactivates the duplicates

BEGIN;

-- 1. Merge 'SWIMDAYS' into 'Swim Days'
-- Keep: 'Swim Days' (58c93bd1-0e69-4315-823c-6173e0d26a12)
-- Remove: 'SWIMDAYS' (8f84fc6f-11a3-4f71-addf-422ace6f8a59)

UPDATE public.products 
SET brand_id = '58c93bd1-0e69-4315-823c-6173e0d26a12' 
WHERE brand_id = '8f84fc6f-11a3-4f71-addf-422ace6f8a59';

UPDATE public.brands 
SET is_active = false 
WHERE id = '8f84fc6f-11a3-4f71-addf-422ace6f8a59';


-- 2. Merge 'LAS OREIROS' into 'Las Oreiro'
-- Keep: 'Las Oreiro' (ba9275d8-0a70-43aa-ada9-6b88dcc7c4a7)
-- Remove: 'LAS OREIROS' (5e900506-03ee-461e-a438-a04b342fc83d)

UPDATE public.products 
SET brand_id = 'ba9275d8-0a70-43aa-ada9-6b88dcc7c4a7' 
WHERE brand_id = '5e900506-03ee-461e-a438-a04b342fc83d';

UPDATE public.brands 
SET is_active = false 
WHERE id = '5e900506-03ee-461e-a438-a04b342fc83d';


-- 3. Safety: Ensure 'Swim Days' and 'Las Oreiro' are active
UPDATE public.brands 
SET is_active = true 
WHERE id IN ('58c93bd1-0e69-4315-823c-6173e0d26a12', 'ba9275d8-0a70-43aa-ada9-6b88dcc7c4a7');

COMMIT;
