import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  Tag,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  FileText,
  Camera,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { votersService } from '../services/supabase/voters.service';
import type { VoterInsert } from '../types/database';
import { supabase } from '../lib/supabase';
import tamilNaduGeoJSON from '../data/geo/tamilnadu-constituencies-full.json';
import * as XLSX from 'xlsx';
import { validateImportBatch, generateImportSummary } from '../utils/importValidation';

export default function VoterDatabase() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddVoter, setShowAddVoter] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Import/Export state
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Real database stats
  const [stats, setStats] = useState({
    totalVoters: 0,
    newThisMonth: 0,
    activeVoters: 0,
    strongSupport: 0,
    moderateSupport: 0,
    contactRate: 0
  });
  const [votersList, setVotersList] = useState<any[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Chart data states
  const [demographicData, setDemographicData] = useState<any[]>([]);
  const [supportLevelChartData, setSupportLevelChartData] = useState<any[]>([]);
  const [boothWiseChartData, setBoothWiseChartData] = useState<any[]>([]);
  const [voterInterests, setVoterInterests] = useState<any[]>([]);
  const [contactMethodStats, setContactMethodStats] = useState<any[]>([]);
  const [geographicCoverage, setGeographicCoverage] = useState<any[]>([]);

  // Fetch all real data from Supabase
  useEffect(() => {
    fetchDatabaseStats();
    fetchVotersList();
    fetchDemographicData();
    fetchSupportLevelData();
    fetchBoothWiseData();
    fetchVoterInterests();
    fetchContactMethodStats();
    fetchGeographicCoverage();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      // Get first day of current month for "New This Month"
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Total voters count
      const { count: total } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true });

      // New this month
      const { count: newThisMonth } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth);

      // Active voters (is_active = true)
      const { count: active } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Strong support (sentiment = 'strong_supporter')
      const { count: strongSupport } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('sentiment', 'strong_supporter');

      // Moderate support (sentiment = 'supporter')
      const { count: moderateSupport } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('sentiment', 'supporter');

      // Contact rate calculation (voters with interaction_count > 0)
      const { count: contacted } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .gt('interaction_count', 0);

      const contactRate = total && total > 0 ? ((contacted || 0) / total) * 100 : 0;

      setStats({
        totalVoters: total || 0,
        newThisMonth: newThisMonth || 0,
        activeVoters: active || 0,
        strongSupport: strongSupport || 0,
        moderateSupport: moderateSupport || 0,
        contactRate: contactRate
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  };

  const fetchVotersList = async () => {
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching voters list:', error);
        return;
      }

      setVotersList(data || []);
    } catch (error) {
      console.error('Error fetching voters list:', error);
    }
  };

  const fetchDemographicData = async () => {
    try {
      // Fetch all voters to calculate caste distribution
      const { data, error } = await supabase
        .from('voters')
        .select('caste');

      if (error) {
        console.error('Error fetching demographic data:', error);
        return;
      }

      console.log('=== DEMOGRAPHIC DATA DEBUG ===');
      console.log('Raw voter data:', data);

      // Count by caste (normalize to uppercase to avoid duplicates)
      const casteCounts: { [key: string]: number } = {};
      data?.forEach((voter) => {
        // Normalize to uppercase to handle case variations (obc, OBC, Obc)
        const casteRaw = voter.caste?.trim() || 'NOT SPECIFIED';
        const casteNormalized = casteRaw.toUpperCase();
        console.log(`Voter caste: "${voter.caste}" → Normalized: "${casteNormalized}"`);
        casteCounts[casteNormalized] = (casteCounts[casteNormalized] || 0) + 1;
      });

      console.log('Caste counts:', casteCounts);

      const total = data?.length || 0;

      // Color mapping using uppercase keys
      const colors: { [key: string]: string } = {
        'GENERAL': '#2563EB',        // Bright electric blue
        'OBC': '#059669',            // Vibrant emerald green
        'SC': '#F59E0B',             // Bright orange
        'ST': '#DC2626',             // Vibrant red
        'OTHER': '#9333EA',          // Vibrant purple
        'NOT SPECIFIED': '#6B7280'   // Neutral gray
      };

      // Display name mapping (proper capitalization)
      const displayNames: { [key: string]: string } = {
        'GENERAL': 'General',
        'OBC': 'OBC',
        'SC': 'SC',
        'ST': 'ST',
        'OTHER': 'Other',
        'NOT SPECIFIED': 'Not Specified'
      };

      const demographicArray = Object.entries(casteCounts).map(([casteKey, count]) => {
        const color = colors[casteKey] || '#9CA3AF';
        const category = displayNames[casteKey] || casteKey;
        console.log(`Mapping: "${casteKey}" → Category: "${category}", Color: "${color}"`);
        return {
          category,
          count,
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0,
          color
        };
      });

      console.log('Final demographic array:', demographicArray);
      console.log('=== END DEBUG ===');

      setDemographicData(demographicArray);
    } catch (error) {
      console.error('Error fetching demographic data:', error);
    }
  };

  const fetchSupportLevelData = async () => {
    try {
      // Fetch sentiment counts
      const { data, error } = await supabase
        .from('voters')
        .select('sentiment');

      if (error) {
        console.error('Error fetching support level data:', error);
        return;
      }

      // Count by sentiment
      const sentimentCounts: { [key: string]: number } = {};
      data?.forEach((voter) => {
        const sentiment = voter.sentiment || 'neutral';
        sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
      });

      // Group into Strong, Moderate, Weak as per user preference
      const supportData = [
        {
          level: 'Strong Support',
          count: sentimentCounts['strong_supporter'] || 0,
          color: '#10B981'
        },
        {
          level: 'Moderate Support',
          count: (sentimentCounts['supporter'] || 0) + (sentimentCounts['neutral'] || 0),
          color: '#F59E0B'
        },
        {
          level: 'Weak Support',
          count: (sentimentCounts['opposition'] || 0) + (sentimentCounts['strong_opposition'] || 0),
          color: '#EF4444'
        }
      ];

      setSupportLevelChartData(supportData);
    } catch (error) {
      console.error('Error fetching support level data:', error);
    }
  };

  const fetchBoothWiseData = async () => {
    try {
      // Fetch all voters with ward and interaction data
      const { data, error } = await supabase
        .from('voters')
        .select('ward, interaction_count, sentiment');

      if (error) {
        console.error('Error fetching booth-wise data:', error);
        return;
      }

      // Group by ward
      const wardStats: { [key: string]: { voters: number; contacted: number; supporters: number } } = {};
      data?.forEach((voter) => {
        const ward = voter.ward || 'Unknown';
        if (!wardStats[ward]) {
          wardStats[ward] = { voters: 0, contacted: 0, supporters: 0 };
        }
        wardStats[ward].voters += 1;
        if (voter.interaction_count && voter.interaction_count > 0) {
          wardStats[ward].contacted += 1;
        }
        if (voter.sentiment === 'strong_supporter' || voter.sentiment === 'supporter') {
          wardStats[ward].supporters += 1;
        }
      });

      // Convert to array and sort by voter count, limit to top 5
      const wardArray = Object.entries(wardStats)
        .map(([booth, stats]) => ({
          booth,
          voters: stats.voters,
          contacted: stats.contacted,
          support: stats.voters > 0 ? Math.round((stats.supporters / stats.voters) * 100) : 0
        }))
        .sort((a, b) => b.voters - a.voters)
        .slice(0, 5);

      setBoothWiseChartData(wardArray);
    } catch (error) {
      console.error('Error fetching booth-wise data:', error);
    }
  };

  const fetchVoterInterests = async () => {
    try {
      // Fetch all voters' tags
      const { data, error } = await supabase
        .from('voters')
        .select('tags');

      if (error) {
        console.error('Error fetching voter interests:', error);
        return;
      }

      // Count occurrences of each tag
      const tagCounts: { [key: string]: number } = {};
      data?.forEach((voter) => {
        const tags = voter.tags || [];
        tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Convert to array, sort by count, get top 5
      const interestsArray = Object.entries(tagCounts)
        .map(([interest, count]) => ({
          interest,
          count,
          percentage: 0 // Will calculate percentage based on max
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate percentage for progress bar (relative to the highest count)
      const maxCount = interestsArray[0]?.count || 1;
      interestsArray.forEach((item) => {
        item.percentage = Math.round((item.count / maxCount) * 100);
      });

      setVoterInterests(interestsArray);
    } catch (error) {
      console.error('Error fetching voter interests:', error);
    }
  };

  const fetchContactMethodStats = async () => {
    try {
      // Query voter_interactions table
      const { data, error } = await supabase
        .from('voter_interactions')
        .select('interaction_type, sentiment');

      if (error) {
        console.error('Error fetching contact method stats:', error);
        return;
      }

      // Count by interaction type and calculate success
      const methodCounts: { [key: string]: { total: number; successful: number } } = {};

      data?.forEach((interaction) => {
        const type = interaction.interaction_type || 'unknown';
        if (!methodCounts[type]) {
          methodCounts[type] = { total: 0, successful: 0 };
        }
        methodCounts[type].total += 1;
        if (interaction.sentiment === 'positive') {
          methodCounts[type].successful += 1;
        }
      });

      // Transform to display format
      const methodDisplayNames: { [key: string]: string } = {
        'phone_call': 'Phone Call',
        'door_visit': 'Door-to-door',
        'whatsapp': 'WhatsApp',
        'event_meeting': 'Rally',
        'sms': 'SMS',
        'email': 'Email'
      };

      const statsArray = Object.entries(methodCounts)
        .map(([type, stats]) => ({
          method: methodDisplayNames[type] || type,
          success: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0,
          attempts: stats.total
        }))
        .filter(stat => stat.attempts > 0) // Only show methods with attempts
        .sort((a, b) => b.success - a.success); // Sort by success rate

      setContactMethodStats(statsArray);
    } catch (error) {
      console.error('Error fetching contact method stats:', error);
    }
  };

  const fetchGeographicCoverage = async () => {
    try {
      // Fetch all active voters with ward and interaction data
      const { data, error } = await supabase
        .from('voters')
        .select('ward, interaction_count')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching geographic coverage:', error);
        return;
      }

      // Classify by area type based on ward name
      const areaCounts: { [key: string]: { total: number; contacted: number } } = {
        'urban': { total: 0, contacted: 0 },
        'semi_urban': { total: 0, contacted: 0 },
        'rural': { total: 0, contacted: 0 }
      };

      data?.forEach((voter) => {
        const ward = (voter.ward || '').toLowerCase();
        let areaType = 'rural'; // default

        if (ward.includes('urban') && !ward.includes('semi')) {
          areaType = 'urban';
        } else if (ward.includes('semi') || ward.includes('semi-urban')) {
          areaType = 'semi_urban';
        } else if (ward.includes('rural')) {
          areaType = 'rural';
        }

        areaCounts[areaType].total += 1;
        if (voter.interaction_count && voter.interaction_count > 0) {
          areaCounts[areaType].contacted += 1;
        }
      });

      // Transform to display format
      const areaDisplayNames: { [key: string]: string } = {
        'urban': 'Urban Areas',
        'semi_urban': 'Semi-Urban',
        'rural': 'Rural Areas'
      };

      const coverageArray = Object.entries(areaCounts)
        .map(([areaType, stats]) => ({
          area: areaDisplayNames[areaType],
          coverage: stats.total > 0 ? Math.round((stats.contacted / stats.total) * 100) : 0,
          voters: stats.total
        }))
        .filter(stat => stat.voters > 0) // Only show areas with voters
        .sort((a, b) => b.coverage - a.coverage); // Sort by coverage

      setGeographicCoverage(coverageArray);
    } catch (error) {
      console.error('Error fetching geographic coverage:', error);
    }
  };

  // Debug: Log user state
  useEffect(() => {
    console.log('=== VOTER DATABASE DEBUG ===');
    console.log('User object:', user);
    console.log('User ID:', user?.id);
    console.log('User Email:', user?.email);
    console.log('Organization ID:', user?.organization_id);
    console.log('Has organization?', !!user?.organization_id);
    console.log('========================');
  }, [user]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    voterIdCard: '',
    phoneNumber: '',
    email: '',
    caste: '',
    religion: '',
    education: '',
    occupation: '',
    constituency: '',
    booth: '',
    address: '',
    interests: [] as string[]
  });

  // Constituency search state
  const [constituencySearch, setConstituencySearch] = useState('');

  // Extract all constituencies from GeoJSON and sort alphabetically
  const allConstituencies = (tamilNaduGeoJSON as any).features
    .map((feature: any) => ({
      code: `TN${String(Math.floor(feature.properties.AC_NO)).padStart(3, '0')}`,
      name: feature.properties.AC_NAME,
      district: feature.properties.DIST_NAME,
      acNumber: feature.properties.AC_NO
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Filter constituencies based on search term
  const filteredConstituencies = constituencySearch
    ? allConstituencies.filter((c: any) =>
        c.name.toLowerCase().includes(constituencySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(constituencySearch.toLowerCase()) ||
        c.district.toLowerCase().includes(constituencySearch.toLowerCase())
      )
    : allConstituencies;

  // Mock voter database
  const voterDatabase = [
    {
      id: 'VTR001',
      name: 'Rajesh Kumar',
      age: 42,
      gender: 'Male',
      phone: '+91-9876543210',
      email: 'rajesh.kumar@email.com',
      address: 'Plot 45, Sector 12, Gurgaon',
      constituency: 'Gurgaon Rural',
      booth: 'GR-045',
      voterIdCard: 'ABC123456789',
      demographics: {
        caste: 'General',
        religion: 'Hindu',
        education: 'Graduate',
        occupation: 'Engineer',
        income: '5-10 Lakhs'
      },
      interests: ['Infrastructure', 'Technology', 'Education'],
      contactHistory: [
        { date: '2024-01-15', type: 'Door-to-door', worker: 'Amit Singh', notes: 'Positive response to education policies' },
        { date: '2024-01-10', type: 'Phone Call', worker: 'Priya Sharma', notes: 'Interested in infrastructure development' }
      ],
      engagement: {
        ralliesAttended: 2,
        lastContact: '2024-01-15',
        supportLevel: 'Strong',
        likelihood: 95
      },
      status: 'Active',
      addedBy: 'Field Worker 001',
      addedDate: '2024-01-01'
    },
    {
      id: 'VTR002',
      name: 'Sunita Devi',
      age: 38,
      gender: 'Female',
      phone: '+91-9876543211',
      email: 'sunita.devi@email.com',
      address: 'House 23, Block C, Noida',
      constituency: 'Noida',
      booth: 'ND-023',
      voterIdCard: 'DEF987654321',
      demographics: {
        caste: 'OBC',
        religion: 'Hindu',
        education: 'Post Graduate',
        occupation: 'Teacher',
        income: '3-5 Lakhs'
      },
      interests: ['Education', 'Women Safety', 'Healthcare'],
      contactHistory: [
        { date: '2024-01-12', type: 'Rally', worker: 'Meera Gupta', notes: 'Very enthusiastic about education reforms' }
      ],
      engagement: {
        ralliesAttended: 3,
        lastContact: '2024-01-12',
        supportLevel: 'Strong',
        likelihood: 90
      },
      status: 'Active',
      addedBy: 'Field Worker 002',
      addedDate: '2024-01-02'
    },
    {
      id: 'VTR003',
      name: 'Mohammed Ali',
      age: 35,
      gender: 'Male',
      phone: '+91-9876543212',
      email: 'mohammed.ali@email.com',
      address: 'Lane 5, Old Delhi',
      constituency: 'Chandni Chowk',
      booth: 'CC-012',
      voterIdCard: 'GHI456789123',
      demographics: {
        caste: 'Muslim',
        religion: 'Islam',
        education: 'Graduate',
        occupation: 'Business',
        income: '2-3 Lakhs'
      },
      interests: ['Economic Policy', 'Small Business', 'Healthcare'],
      contactHistory: [
        { date: '2024-01-14', type: 'WhatsApp', worker: 'Arjun Patel', notes: 'Concerned about economic policies' }
      ],
      engagement: {
        ralliesAttended: 1,
        lastContact: '2024-01-14',
        supportLevel: 'Moderate',
        likelihood: 70
      },
      status: 'Active',
      addedBy: 'Field Worker 003',
      addedDate: '2024-01-03'
    }
  ];

  // Analytics data - using real stats from database (no hardcoded data)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'database', label: 'Voter Database', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'registration', label: 'Registration', icon: Plus }
  ];

  const filteredVoters = votersList.filter(voter => {
    const fullName = `${voter.first_name} ${voter.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (voter.ward || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (voter.voter_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'strong' && voter.sentiment === 'strong_supporter') ||
                         (selectedFilter === 'moderate' && (voter.sentiment === 'supporter' || voter.sentiment === 'neutral')) ||
                         (selectedFilter === 'weak' && (voter.sentiment === 'opposition' || voter.sentiment === 'strong_opposition'));

    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVoters = filteredVoters.slice(startIndex, endIndex);

  // Reset to page 1 when search/filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  // Handle interest checkbox toggle
  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle constituency selection - updates both form data and search box
  const handleConstituencySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    // Update form data
    setFormData(prev => ({ ...prev, constituency: selectedValue }));
    // Update search box to show selected constituency
    setConstituencySearch(selectedValue);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: '',
      age: '',
      gender: '',
      voterIdCard: '',
      phoneNumber: '',
      email: '',
      caste: '',
      religion: '',
      education: '',
      occupation: '',
      constituency: '',
      booth: '',
      address: '',
      interests: []
    });
  };

  // Handle form submission
  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in and has permission to add voters
    // Note: Admin, superadmin, and manager roles have permission per RLS policy
    if (!user) {
      setErrorMessage('Error: You must be logged in to add voters.');
      setShowError(true);
      return;
    }

    // Validate required fields
    if (!formData.fullName || !formData.age || !formData.gender ||
        !formData.voterIdCard || !formData.phoneNumber ||
        !formData.constituency || !formData.booth) {
      setErrorMessage('Please fill in all required fields (marked with *)');
      setShowError(true);
      return;
    }

    setLoading(true);

    try {
      // Prepare voter data for Supabase - mapped to correct database schema
      const nameParts = formData.fullName.trim().split(' ');
      const voterData: any = {
        // Split name into first_name and last_name (DB schema)
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || null,

        // Basic info - corrected field names
        age: parseInt(formData.age),
        gender: formData.gender as 'male' | 'female' | 'other',
        voter_id: formData.voterIdCard,              // Changed from voter_id_number

        // Contact - corrected field names
        phone: formData.phoneNumber,                 // Changed from phone_number
        email: formData.email || null,

        // Address - corrected field names
        address_line1: formData.address || null,     // Changed from address
        ward: formData.booth || null,                 // Polling booth number stored in ward field

        // Demographics - now saving to database
        caste: formData.caste || null,
        religion: formData.religion || null,
        education: formData.education || null,
        occupation: formData.occupation || null,

        // Political data - corrected field names
        tags: formData.interests || [],              // Changed from political_interests
        sentiment: 'neutral',                        // Changed from support_level
        party_affiliation: 'unknown',

        // Status - corrected to boolean
        is_active: true,                             // Changed from status: 'active'
        is_verified: false,

        // Engagement defaults
        contact_frequency: 0,
        interaction_count: 0,
        positive_interactions: 0,
        negative_interactions: 0,
        voting_history: [],
        is_opinion_leader: false,
        influence_level: 'low'
      };

      // Save to Supabase
      await votersService.create(voterData);

      // Success! Show message and reset form
      setShowSuccess(true);
      resetForm();

      // Refresh all data including charts
      fetchDatabaseStats();
      fetchVotersList();
      fetchDemographicData();
      fetchSupportLevelData();
      fetchBoothWiseData();
      fetchVoterInterests();
      fetchContactMethodStats();
      fetchGeographicCoverage();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error adding voter:', error);
      setErrorMessage(`Failed to add voter: ${error.message || 'Unknown error'}`);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Export Database to Excel
  const handleExportDatabase = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to export data.');
      setShowError(true);
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Fetch all voters
      setExportProgress(20);
      const voters = await votersService.getAllForExport();

      setExportProgress(60);

      // Transform data for export with user-friendly column names
      const exportData = voters.map(voter => ({
        'Voter ID': voter.voter_id || '',
        'First Name': voter.first_name || '',
        'Last Name': voter.last_name || '',
        'Middle Name': voter.middle_name || '',
        'Age': voter.age || '',
        'Gender': voter.gender ? voter.gender.charAt(0).toUpperCase() + voter.gender.slice(1) : '',
        'Date of Birth': voter.date_of_birth || '',
        'Phone': voter.phone || '',
        'Alternate Phone': voter.alternate_phone || '',
        'Email': voter.email || '',
        'Caste': voter.caste || '',
        'Religion': voter.religion || '',
        'Education': voter.education || '',
        'Occupation': voter.occupation || '',
        'Booth': voter.booth_number || voter.ward || '',
        'Ward': voter.ward || '',
        'Pincode': voter.pincode || '',
        'Address Line 1': voter.address_line1 || '',
        'Address Line 2': voter.address_line2 || '',
        'Party Affiliation': voter.party_affiliation || '',
        'Sentiment': voter.sentiment ? voter.sentiment.charAt(0).toUpperCase() + voter.sentiment.slice(1) : '',
        'Influence Level': voter.influence_level ? voter.influence_level.charAt(0).toUpperCase() + voter.influence_level.slice(1) : '',
        'Tags': Array.isArray(voter.tags) ? voter.tags.join(', ') : '',
        'Is Opinion Leader': voter.is_opinion_leader ? 'Yes' : 'No',
        'Is Active': voter.is_active ? 'Yes' : 'No',
        'Notes': voter.notes || '',
        'Created At': voter.created_at ? new Date(voter.created_at).toLocaleString() : ''
      }));

      setExportProgress(80);

      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');

      // Auto-size columns
      const maxWidths: { [key: string]: number } = {};
      exportData.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = String(row[key as keyof typeof row]);
          maxWidths[key] = Math.max(maxWidths[key] || 10, value.length, key.length);
        });
      });
      worksheet['!cols'] = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.min(maxWidths[key] || 10, 50)
      }));

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `voters-database-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      setExportProgress(100);
      setSuccessMessage(`Successfully exported ${exportData.length} voters to ${filename}`);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setExportProgress(0);
      }, 3000);

    } catch (error: any) {
      console.error('Error exporting database:', error);
      setErrorMessage(`Export failed: ${error.message || 'Unknown error'}`);
      setShowError(true);
    } finally {
      setIsExporting(false);
    }
  };

  // Import Data from Excel
  const handleImportData = () => {
    if (!user) {
      setErrorMessage('You must be logged in to import data.');
      setShowError(true);
      return;
    }

    // Trigger file input
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Please upload an Excel file (.xlsx or .xls)');
      setShowError(true);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be less than 10MB');
      setShowError(true);
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Read file
      setImportProgress(10);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('No data found in the uploaded file');
      }

      setImportProgress(30);

      // Validate and transform data
      const { valid, errors } = validateImportBatch(jsonData);

      if (errors.length > 0 && valid.length === 0) {
        // All rows have errors
        const errorSummary = errors.slice(0, 5).map(e =>
          `Row ${e.row}: ${e.field} - ${e.message}`
        ).join('\n');
        throw new Error(`Validation errors:\n${errorSummary}${errors.length > 5 ? `\n...and ${errors.length - 5} more errors` : ''}`);
      }

      setImportProgress(50);

      // Import valid voters
      const result = await votersService.bulkCreate(valid);

      setImportProgress(90);

      // Generate summary message
      const summary = generateImportSummary(
        jsonData.length,
        result.success,
        result.duplicates,
        result.errors + errors.length
      );

      setSuccessMessage(`Import complete! ${summary}`);
      setShowSuccess(true);

      // Refresh all data
      fetchDatabaseStats();
      fetchVotersList();
      fetchDemographicData();
      fetchSupportLevelData();
      fetchBoothWiseData();
      fetchVoterInterests();
      fetchContactMethodStats();
      fetchGeographicCoverage();

      setImportProgress(100);

      setTimeout(() => {
        setShowSuccess(false);
        setImportProgress(0);
      }, 5000);

    } catch (error: any) {
      console.error('Error importing data:', error);
      setErrorMessage(`Import failed: ${error.message || 'Unknown error'}`);
      setShowError(true);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download Import Template
  const handleDownloadTemplate = () => {
    // Create sample data with all required and optional fields
    const templateData = [
      {
        'Voter ID': 'ABC1234567',
        'First Name': 'Rajesh',
        'Last Name': 'Kumar',
        'Middle Name': '',
        'Age': 35,
        'Gender': 'Male',
        'Date of Birth': '1989-05-15',
        'Phone': '9876543210',
        'Alternate Phone': '',
        'Email': 'rajesh.kumar@email.com',
        'Caste': 'General',
        'Religion': 'Hindu',
        'Education': 'Graduate',
        'Occupation': 'Engineer',
        'Booth': '1',
        'Ward': 'Ward 1',
        'Pincode': '600001',
        'Address Line 1': 'Plot 45, Sector 12',
        'Address Line 2': 'Near City Center',
        'Party Affiliation': 'Unknown',
        'Sentiment': 'Neutral',
        'Influence Level': 'Medium',
        'Tags': 'youth, technology',
        'Is Opinion Leader': 'No',
        'Is Active': 'Yes',
        'Notes': 'Interested in education policies'
      },
      {
        'Voter ID': 'DEF9876543',
        'First Name': 'Priya',
        'Last Name': 'Sharma',
        'Middle Name': '',
        'Age': 28,
        'Gender': 'Female',
        'Date of Birth': '1996-08-20',
        'Phone': '9876543211',
        'Alternate Phone': '9876543212',
        'Email': 'priya.sharma@email.com',
        'Caste': 'OBC',
        'Religion': 'Hindu',
        'Education': 'Post Graduate',
        'Occupation': 'Teacher',
        'Booth': '2',
        'Ward': 'Ward 2',
        'Pincode': '600002',
        'Address Line 1': 'House 23, Block C',
        'Address Line 2': '',
        'Party Affiliation': 'Unknown',
        'Sentiment': 'Positive',
        'Influence Level': 'High',
        'Tags': 'education, women',
        'Is Opinion Leader': 'Yes',
        'Is Active': 'Yes',
        'Notes': 'Active in community events'
      }
    ];

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters Template');

    // Add instructions sheet
    const instructions = [
      { 'Field': 'Voter ID', 'Required': 'Yes', 'Description': 'Unique voter ID card number' },
      { 'Field': 'First Name', 'Required': 'Yes', 'Description': 'First name of the voter' },
      { 'Field': 'Last Name', 'Required': 'No', 'Description': 'Last name of the voter' },
      { 'Field': 'Age', 'Required': 'Yes', 'Description': 'Age between 18 and 120' },
      { 'Field': 'Gender', 'Required': 'Yes', 'Description': 'Male, Female, or Other' },
      { 'Field': 'Phone', 'Required': 'Yes', 'Description': '10 digit phone number' },
      { 'Field': 'Booth', 'Required': 'Yes', 'Description': 'Polling booth number' },
      { 'Field': 'Email', 'Required': 'No', 'Description': 'Valid email address' },
      { 'Field': 'Sentiment', 'Required': 'No', 'Description': 'Positive, Negative, or Neutral' },
      { 'Field': 'Influence Level', 'Required': 'No', 'Description': 'High, Medium, or Low' },
      { 'Field': 'Tags', 'Required': 'No', 'Description': 'Comma-separated tags' },
      { 'Field': 'Is Opinion Leader', 'Required': 'No', 'Description': 'Yes or No' },
      { 'Field': 'Is Active', 'Required': 'No', 'Description': 'Yes or No (defaults to Yes)' }
    ];
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Auto-size columns
    worksheet['!cols'] = Array(Object.keys(templateData[0]).length).fill({ wch: 15 });
    instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 50 }];

    // Download template
    XLSX.writeFile(workbook, 'voter-import-template.xlsx');

    setSuccessMessage('Template downloaded successfully!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Error Dialog */}
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowError(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Success</h3>
            </div>
            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {successMessage || 'Voter added successfully!'}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccess(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            Voter Database Management
          </h2>
          <p className="text-gray-600">Comprehensive voter registration and engagement tracking system</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelected}
            className="hidden"
          />

          <button
            onClick={handleImportData}
            disabled={isImporting}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{isImporting ? `Importing... ${importProgress}%` : 'Import Data'}</span>
          </button>

          <button
            onClick={handleExportDatabase}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? `Exporting... ${exportProgress}%` : 'Export Database'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.totalVoters.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Voters</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">+{stats.newThisMonth.toLocaleString()}</div>
              <div className="text-xs text-gray-600">New This Month</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.activeVoters.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Active Voters</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.strongSupport.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Strong Support</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.moderateSupport.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Moderate Support</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.contactRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Contact Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Demographic Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographic Distribution</h3>
              {demographicData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {demographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Voters']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No demographic data available
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Level Distribution</h3>
              {supportLevelChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supportLevelChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="level" type="category" width={120} />
                    <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Voters']} />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No support level data available
                </div>
              )}
            </div>
          </div>

          {/* Ward-wise Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ward-wise Coverage Analysis (Top 5)</h3>
            <div className="overflow-x-auto">
              {boothWiseChartData.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Ward</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Voters</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Contacted</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Contact Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Support %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boothWiseChartData.map((booth) => (
                      <tr key={booth.booth} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{booth.booth}</td>
                        <td className="py-3 px-4 text-right">{booth.voters.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{booth.contacted.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end">
                            <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: `${booth.voters > 0 ? (booth.contacted / booth.voters) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {booth.voters > 0 ? Math.round((booth.contacted / booth.voters) * 100) : 0}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            booth.support >= 80 ? 'bg-green-100 text-green-800' :
                            booth.support >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booth.support}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No ward data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, voter ID, or constituency..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select 
                value={selectedFilter} 
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Support Levels</option>
                <option value="strong">Strong Support</option>
                <option value="moderate">Moderate Support</option>
                <option value="weak">Weak Support</option>
              </select>
              <button 
                onClick={() => setShowAddVoter(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Voter</span>
              </button>
            </div>
          </div>

          {/* Voter List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Voter Details</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Demographics</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Contact Info</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Engagement</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVoters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {votersList.length === 0
                          ? 'No voters found in database. Add voters using the Registration tab.'
                          : 'No voters match your search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedVoters.map((voter) => (
                      <tr key={voter.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {voter.first_name} {voter.last_name || ''}
                            </div>
                            <div className="text-sm text-gray-600">{voter.voter_id || 'N/A'}</div>
                            <div className="text-sm text-gray-600">{voter.ward || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div>{voter.age}y, {voter.gender || 'N/A'}</div>
                            <div className="text-gray-600">{voter.party_affiliation || 'Unknown'}</div>
                            <div className="text-gray-600">{voter.influence_level || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {voter.phone || 'N/A'}
                            </div>
                            <div className="flex items-center mt-1">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {voter.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              voter.sentiment === 'strong_supporter' ? 'bg-green-100 text-green-800' :
                              voter.sentiment === 'supporter' ? 'bg-green-50 text-green-700' :
                              voter.sentiment === 'neutral' ? 'bg-gray-100 text-gray-800' :
                              voter.sentiment === 'opposition' ? 'bg-red-50 text-red-700' :
                              voter.sentiment === 'strong_opposition' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {voter.sentiment || 'neutral'}
                            </span>
                            <div className="text-gray-600 mt-1">
                              {voter.interaction_count || 0} interactions
                            </div>
                            <div className="text-gray-600">
                              {voter.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                              <Phone className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredVoters.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                {/* Left side - Items per page and info */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">per page</span>
                  </div>
                  <span className="text-sm text-gray-700">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredVoters.length)} of {filteredVoters.length} voters
                  </span>
                </div>

                {/* Right side - Page navigation */}
                <div className="flex items-center space-x-2">
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border ${
                      currentPage === 1
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;

                      if (totalPages <= maxVisible) {
                        // Show all pages
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Show first page, last page, current page and neighbors
                        if (currentPage <= 3) {
                          for (let i = 1; i <= 4; i++) pages.push(i);
                          pages.push('...');
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push('...');
                          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push('...');
                          pages.push(currentPage - 1);
                          pages.push(currentPage);
                          pages.push(currentPage + 1);
                          pages.push('...');
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((page, idx) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`px-3 py-1 rounded border ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded border ${
                      currentPage === totalPages
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interest Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Voter Interests</h3>
              <div className="space-y-3">
                {voterInterests.length > 0 ? (
                  voterInterests.map((item) => (
                    <div key={item.interest} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{item.interest}</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-12">{item.count.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No voter interest data available
                  </div>
                )}
              </div>
            </div>

            {/* Contact Method Effectiveness */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Method Success</h3>
              <div className="space-y-4">
                {contactMethodStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No contact method data available
                  </div>
                ) : (
                  contactMethodStats.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{method.method}</div>
                        <div className="text-xs text-gray-600">{method.attempts.toLocaleString()} attempts</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{method.success}%</div>
                        <div className="text-xs text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Geographic Coverage */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Coverage</h3>
              <div className="space-y-3">
                {geographicCoverage.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No geographic data available
                  </div>
                ) : (
                  geographicCoverage.map((area) => (
                    <div key={area.area} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{area.area}</span>
                        <span className="text-sm font-medium text-gray-700">{area.coverage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${area.coverage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {area.voters.toLocaleString()} voters
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'registration' && (
        <div className="space-y-6">

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Voter</h3>

            <form onSubmit={handleAddVoter} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                        min="18"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voter ID Card *</label>
                    <input
                      type="text"
                      name="voterIdCard"
                      value={formData.voterIdCard}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Demographics & Location */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Demographics & Location</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caste</label>
                      <select
                        name="caste"
                        value={formData.caste}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Caste</option>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      <select
                        name="religion"
                        value={formData.religion}
                        onChange={handleInputChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Religion</option>
                        <option value="Hindu">Hindu</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Christian">Christian</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <select
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Education</option>
                      <option value="Illiterate">Illiterate</option>
                      <option value="Primary">Primary</option>
                      <option value="Secondary">Secondary</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Constituency *</label>
                      <input
                        type="text"
                        placeholder="Search constituencies..."
                        value={constituencySearch}
                        onChange={(e) => setConstituencySearch(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        name="constituency"
                        value={formData.constituency}
                        onChange={handleConstituencySelect}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        size={5}
                      >
                        <option value="">Select Constituency</option>
                        {filteredConstituencies.map((constituency: any) => (
                          <option key={constituency.code} value={constituency.name}>
                            {constituency.name} ({constituency.district})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Showing {filteredConstituencies.length} of {allConstituencies.length} constituencies
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Booth *</label>
                      <input
                        type="text"
                        name="booth"
                        value={formData.booth}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <h4 className="font-medium text-gray-900 border-b pb-2 mb-4">Political Interests</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['Infrastructure', 'Education', 'Healthcare', 'Employment', 'Women Safety', 'Economic Policy', 'Environment', 'Technology'].map((interest) => (
                    <label key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestToggle(interest)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{interest}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Voter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

