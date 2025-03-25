// backend/server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, 'database.env') });

const app = express();
const port = process.env.PORT || 10000;

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
            // Get month number from name (1-12)
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
            console.log('Filtering by event_type:', event_type);
            conditions.push(`event_type = $${paramCounter}`);
            queryParams.push(event_type);
            paramCounter++;
        }

        if (location && location !== 'All') {
            console.log('Filtering by location:', location);
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
                author: event.event_type || 'Unknown', // Map event_type to author for frontend compatibility
                category: event.location || 'Unknown', // Map location to category
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
        const shortText = event.description ? event.description.substring(0, 150) + '...' : ''; // Limit to 150 characters

        res.json({
            id: event.id,
            title: event.title,
            author: event.event_type || 'Unknown',
            category: event.location || 'Unknown',
            date: new Date(event.event_start_date).getFullYear().toString(),
            month: new Date(event.event_start_date).toLocaleString('sk-SK', { month: 'long' }),
            short_text: shortText, // Use the limited text
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
            author: event.event_type || 'Unknown',
            category: event.location || 'Unknown',
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
        
        // Add the 'All' option with total count
        const totalCount = result.rows.reduce((total, row) => total + parseInt(row.count), 0);
        categoriesData.unshift({
            name: 'All',
            value: 'All',
            count: totalCount
        });
        
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
      `INSERT INTO users (email, password, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name`,
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

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
    console.log(`API available at http://${host}:${port}/api`);
});
