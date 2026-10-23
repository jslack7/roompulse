
 // --------------------------------------------------
 // SUPABASE CLIENT CONFIGURATION
 // --------------------------------------------------

 // Import createClient from the Supabase JavaScript library.
 //
 // createClient() establishes a connection between
 // our React application and our Supabase project.
 import { createClient } from "@supabase/supabase-js";

 // --------------------------------------------------
 // ENVIRONMENT VARIABLES
 // --------------------------------------------------

 // Retrieve our Supabase project URL from the
 // environment variables stored in our .env file.
 //
 // import.meta.env is how Vite allows us to access
 // environment variables in our React application.
 //
 // VITE_SUPABASE_URL identifies which Supabase
 // project RoomPulse should communicate with.
 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

 // Retrieve the Supabase publishable key.
 //
 // This key allows our frontend application
 // to connect to Supabase using the permissions
 // configured for the project.
 //
 // The publishable key is designed for frontend use.
 // Database access must still be protected by
 // Supabase Row Level Security (RLS) policies.
 const supabaseKey =
   import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

 // --------------------------------------------------
 // CREATE AND EXPORT SUPABASE CLIENT
 // --------------------------------------------------

 // Create a Supabase client using our project URL
 // and publishable key.
 //
 // This client provides methods for:
 //
 // - Authentication (sign in, sign up, sign out)
 // - Reading database records
 // - Creating database records
 // - Updating and deleting records
 // - Listening for real-time database changes
 // - Calling Supabase functions
 //
 // export allows other files to import and reuse
 // the same Supabase client.
 export const supabase = createClient(
   supabaseUrl,
   supabaseKey
 );
