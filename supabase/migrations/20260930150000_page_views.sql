-- Contador de visitas propio de la tienda (sin depender de Google Analytics).
-- Cualquiera puede registrar una visita; solo el admin puede leerlas.
CREATE TABLE IF NOT EXISTS public.page_views (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  path text NOT NULL CHECK (char_length(path) <= 300),
  visitor_id text NOT NULL CHECK (char_length(visitor_id) <= 64),
  referrer text CHECK (referrer IS NULL OR char_length(referrer) <= 300)
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log a page view" ON public.page_views;
CREATE POLICY "Anyone can log a page view"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read page views" ON public.page_views;
CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT TO authenticated
  USING (public.is_admin());

-- Resumen para el Dashboard del admin, calculado en la base (fechas en hora argentina).
CREATE OR REPLACE FUNCTION public.get_visit_stats(p_days int DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz constant text := 'America/Argentina/Buenos_Aires';
  v_today date := (now() AT TIME ZONE tz)::date;
  v_from timestamptz := now() - make_interval(days => greatest(p_days, 30) + 1);
  result json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH recent AS (
    SELECT visitor_id, path, (created_at AT TIME ZONE tz)::date AS day
    FROM page_views
    WHERE created_at >= v_from
  )
  SELECT json_build_object(
    'today', (SELECT json_build_object('views', count(*), 'visitors', count(DISTINCT visitor_id))
              FROM recent WHERE day = v_today),
    'last7', (SELECT json_build_object('views', count(*), 'visitors', count(DISTINCT visitor_id))
              FROM recent WHERE day > v_today - 7),
    'last30', (SELECT json_build_object('views', count(*), 'visitors', count(DISTINCT visitor_id))
               FROM recent WHERE day > v_today - 30),
    'daily', (SELECT coalesce(json_agg(d ORDER BY d.day), '[]'::json) FROM (
                SELECT gs::date AS day, count(r.visitor_id) AS views, count(DISTINCT r.visitor_id) AS visitors
                FROM generate_series(v_today - (p_days - 1), v_today, interval '1 day') gs
                LEFT JOIN recent r ON r.day = gs::date
                GROUP BY gs
              ) d),
    'topProducts', (SELECT coalesce(json_agg(t ORDER BY t.views DESC), '[]'::json) FROM (
                      SELECT v.sku, v.views, p.name
                      FROM (
                        SELECT substring(path from '^/producto/([^/?#]+)') AS sku, count(*) AS views
                        FROM recent
                        WHERE path LIKE '/producto/%' AND day > v_today - 30
                        GROUP BY 1
                        ORDER BY 2 DESC
                        LIMIT 10
                      ) v
                      LEFT JOIN products p ON p.sku = v.sku
                    ) t)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_visit_stats(int) FROM public;
GRANT EXECUTE ON FUNCTION public.get_visit_stats(int) TO authenticated;
