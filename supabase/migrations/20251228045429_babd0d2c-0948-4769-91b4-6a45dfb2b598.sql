-- Enable realtime for orders table for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Set replica identity to full for complete row data in realtime updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;