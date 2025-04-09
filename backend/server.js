// backend/server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, 'database.env') });

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    }
});

// Function to generate Google Maps embed URL from location
const getGoogleMapsEmbedUrl = (location) => {
    if (!location || location === 'Unknown' || location === 'Miesto Neznáme' || location === 'Miesto neznáme') {
        // Default to Prešov if location is not provided
        return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2641.8383484567!2d21.2353986!3d48.9977246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473eed62a563a9ef%3A0xb18994e09e7a9e06!2sJarkov%C3%A1%203110%2F77%2C%20080%2001%20Pre%C5%A1ov!5e0!3m2!1ssk!2ssk!4v1709912345678!5m2!1ssk!2ssk";
    }
    
    // Encode the location for use in the URL
    const encodedLocation = encodeURIComponent(location);
    
    // Create a Google Maps embed URL with the location
    // Use a more generic approach that will work with any location
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedLocation}&zoom=15`;
    
    return mapUrl;
};

// Test database connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Successfully connected to Neon PostgreSQL database');
        done();
    }
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// API endpoint to get events with filtering and pagination
app.get('/api/blog-posts', async (req, res) => {
    const { year, month, event_type, location, search, page = 1, limit = 4 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let queryParams = [];
        let conditions = [];
        let paramCounter = 1;

        if (year && year !== 'All') {
            conditions.push(`EXTRACT(YEAR FROM event_start_date) = $${paramCounter}`);
            queryParams.push(year);
            paramCounter++;
        }

        if (month && month !== 'All') {
            const monthNames = [
                'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 
                'Júl', 'August', 'September', 'Október', 'November', 'December'
            ];
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
            
            if (monthIndex >= 0) {
                const monthNumber = monthIndex + 1; // 1-based month number
                conditions.push(`EXTRACT(MONTH FROM event_start_date) = $${paramCounter}`);
                queryParams.push(monthNumber);
                paramCounter++;
            }
        }

        if (event_type && event_type !== 'All') {
            conditions.push(`event_type = $${paramCounter}`);
            queryParams.push(event_type);
            paramCounter++;
        }

        if (location && location !== 'All') {
            conditions.push(`location = $${paramCounter}`);
            queryParams.push(location);
            paramCounter++;
        }

        if (search) {
            conditions.push(`(
                title ILIKE $${paramCounter} OR
                description ILIKE $${paramCounter} OR
                location ILIKE $${paramCounter}
            )`);
            queryParams.push(`%${search}%`);
            paramCounter++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count total matching events
        const countQuery = `SELECT COUNT(*) FROM events ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count);

        // Get paginated events
        const eventsQuery = `
            SELECT * FROM events
                              ${whereClause}
            ORDER BY event_start_date DESC, created_at DESC
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        const finalParams = [...queryParams, limit, offset];
        const eventsResult = await pool.query(eventsQuery, finalParams);

        res.json({
            posts: eventsResult.rows.map(event => ({
                id: event.id,
                title: event.title,
                category: event.event_type || 'Unknown', // Map event_type to category
                location: event.location || 'Unknown', // Add location
                map_url: getGoogleMapsEmbedUrl(event.location), // Always generate a new map URL based on the location
                date: new Date(event.event_start_date).getFullYear().toString(),
                month: new Date(event.event_start_date).toLocaleString('sk-SK', { month: 'long' }),
                short_text: event.description ? event.description.substring(0, 100) + '...' : '',
                full_text: event.description || '',
                image: event.image_url || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80',
                event_start_date: event.event_start_date,
                event_end_date: event.event_end_date,
                start_time: event.start_time,
                end_time: event.end_time,
                tickets: event.tickets,
                link_to: event.link_to
            })),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Get a specific event by ID
app.get('/api/blog-posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = result.rows[0];
        
        res.json({
            id: event.id,
            title: event.title,
            category: event.event_type || 'Unknown',
            location: event.location || 'Unknown',
            map_url: getGoogleMapsEmbedUrl(event.location), // Use the already generated map URL
            date: new Date(event.event_start_date).getFullYear().toString(),
            month: new Date(event.event_start_date).toLocaleString('sk-SK', { month: 'long' }),
            short_text: event.description ? event.description.substring(0, 150) + '...' : '',
            full_text: event.description || '',
            image: event.image_url || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80',
            event_start_date: event.event_start_date,
            event_end_date: event.event_end_date,
            start_time: event.start_time,
            end_time: event.end_time,
            tickets: event.tickets,
            link_to: event.link_to
        });
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create new event
app.post('/api/blog-posts', async (req, res) => {
    try {
        const {
            title,
            event_type,
            location,
            event_start_date,
            event_end_date,
            start_time,
            end_time,
            tickets,
            description,
            link_to
        } = req.body;

        // Validate required fields
        if (!title || !event_start_date || !start_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
            INSERT INTO events (
                title, 
                event_type, 
                location, 
                event_start_date, 
                event_end_date, 
                start_time, 
                end_time, 
                tickets, 
                description, 
                link_to
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const result = await pool.query(query, [
            title,
            event_type,
            location,
            event_start_date,
            event_end_date,
            start_time,
            end_time,
            tickets,
            description,
            link_to
        ]);

        const event = result.rows[0];
        res.status(201).json({
            id: event.id,
            title: event.title,
            category: event.event_type || 'Unknown',
            date: new Date(event.event_start_date).getFullYear().toString(),
            month: new Date(event.event_start_date).toLocaleString('sk-SK', { month: 'long' }),
            short_text: event.description ? event.description.substring(0, 150) + '...' : '',
            full_text: event.description || '',
            image: event.image_url || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80',
            event_start_date: event.event_start_date,
            event_end_date: event.event_end_date,
            start_time: event.start_time,
            end_time: event.end_time,
            tickets: event.tickets,
            link_to: event.link_to
        });
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// API endpoints for filter options
app.get('/api/years', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT EXTRACT(YEAR FROM event_start_date) as year FROM events ORDER BY year DESC');
        const years = result.rows.map(row => row.year.toString());
        res.json(['All', ...years]);
    } catch (err) {
        console.error('Error fetching years:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/months', async (req, res) => {
    try {
        // Return all months in calendar order
        const allMonths = [
            'Január',     // January
            'Február',    // February
            'Marec',      // March
            'Apríl',      // April
            'Máj',        // May
            'Jún',        // June
            'Júl',        // July
            'August',     // August
            'September',  // September
            'Október',    // October
            'November',   // November
            'December'    // December
        ];
        
        // Query to get event counts by month number instead of name to avoid string comparison issues
        const result = await pool.query("SELECT EXTRACT(MONTH FROM event_start_date) as month_num, COUNT(*) as count FROM events GROUP BY month_num");
        
        // Create a map of month number to event count (1-12)
        const monthCountMap = new Map();
        result.rows.forEach(row => {
            const monthNum = parseInt(row.month_num);
            monthCountMap.set(monthNum, parseInt(row.count));
        });
        
        // Create response with month details based on numeric month
        const monthsData = allMonths.map((month, index) => {
            // index is 0-based, but month numbers are 1-based
            const monthNum = index + 1;
            const hasEvents = monthCountMap.has(monthNum);
            const count = hasEvents ? monthCountMap.get(monthNum) : 0;
            
            return {
                name: month,
                value: month,
                hasEvents: hasEvents,
                count: count
            };
        });
        
        // Add the 'All' option
        monthsData.unshift({
            name: 'All',
            value: 'All',
            hasEvents: true,
            count: result.rows.reduce((total, row) => total + parseInt(row.count), 0)
        });
        
        res.json(monthsData);
    } catch (err) {
        console.error('Error fetching months:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        // Get all distinct event types and their counts, including NULL values
        const result = await pool.query(`
            SELECT 
                COALESCE(event_type, 'Uncategorized') as event_type,
                COUNT(*) as count
            FROM events 
            GROUP BY COALESCE(event_type, 'Uncategorized')
            ORDER BY COALESCE(event_type, 'Uncategorized')
        `);
        
        console.log('Categories Query Result:', result.rows);
        
        // Create response with category details
        const categoriesData = result.rows.map(row => ({
            name: row.event_type === 'Uncategorized' ? 'Uncategorized' : row.event_type,
            value: row.event_type === 'Uncategorized' ? 'Uncategorized' : row.event_type,
            count: parseInt(row.count)
        }));
        
        console.log('Final Categories Response:', categoriesData);
        res.json(categoriesData);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/authors', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT location FROM events WHERE location IS NOT NULL ORDER BY location');
        const locations = result.rows.map(row => row.location);
        res.json(['All', ...locations]);
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, first_name, last_name`,
      [email, hashedPassword, first_name, last_name]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (excluding password)
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
