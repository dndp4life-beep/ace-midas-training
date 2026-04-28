import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vsenslqoczeutkylnzar.supabase.co"
const supabaseKey = "sb_publishable__nZHrARnBxhPTcTX282WMQ_ePTXP-ri"

export const supabase = createClient(supabaseUrl, supabaseKey)
