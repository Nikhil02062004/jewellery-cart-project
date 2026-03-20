-- Create trigger function for order notifications
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, order_id)
  VALUES (
    'New Order Received',
    'Order from ' || NEW.customer_name || ' for ₹' || NEW.total_amount::text,
    'new_order',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS on_new_order_notify_admin ON public.orders;
CREATE TRIGGER on_new_order_notify_admin
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_order();