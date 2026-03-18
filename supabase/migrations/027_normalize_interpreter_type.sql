-- Normalize interpreter_type values to title case canonical form
-- "hearing" → "Hearing Interpreter", "" → "Hearing Interpreter" (default)
-- "Deaf Interpreter" stays as-is

UPDATE public.interpreter_profiles
SET interpreter_type = 'Hearing Interpreter'
WHERE interpreter_type = 'hearing';

UPDATE public.interpreter_profiles
SET interpreter_type = 'Hearing Interpreter'
WHERE interpreter_type = '' OR interpreter_type IS NULL;
