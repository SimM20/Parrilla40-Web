-- Match the historical RPC to the anonymous, password-gated dashboard.
-- Preserves its implementation, password verifier and all historical responses.
begin;
revoke all on function public.playtest_results(text) from public, anon, authenticated;
grant execute on function public.playtest_results(text) to anon;
commit;
