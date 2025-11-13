import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Groups,
  School,
  HealthAndSafety,
  Agriculture,
  Work,
  AccountBalance,
  Campaign,
  LocationCity,
  VolunteerActivism,
  EmojiEvents,
  AutoAwesome,
  Login as LoginIcon
} from '@mui/icons-material';
import { TVKLogo } from '../components/TVKLogo';

const TVKLandingPage = () => {
  // Load ElevenLabs ConvAI widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-red-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <TVKLogo size={40} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  <span className="text-red-600">Tamilaga Vettri</span>{' '}
                  <span className="text-yellow-600">Kazhagam</span>
                </h1>
                <p className="text-xs text-gray-600">தமிழக வெற்றிக் கழகம்</p>
              </div>
            </div>

            {/* Login/Signup Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 font-semibold transition-colors"
              >
                <LoginIcon className="w-5 h-5" />
                Login
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md"
              >
                <VolunteerActivism className="w-5 h-5" />
                <span className="hidden sm:inline">Join Movement</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-red-600 to-yellow-500 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <Campaign className="w-4 h-4" />
          <span className="font-semibold">TVK Victory Rally 2026</span>
          <span className="hidden sm:inline">- Join the Movement for Tamil Nadu's Future</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-yellow-500/10 to-red-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-yellow-500 blur-lg opacity-50"></div>
                <div className="relative bg-white p-4 rounded-full shadow-2xl">
                  <EmojiEvents className="w-16 h-16 text-red-600" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-red-600">Tamilaga Vettri</span>{' '}
              <span className="text-yellow-600">Kazhagam</span>
            </h1>
            <p className="text-2xl text-gray-700 mb-4 font-semibold">
              தமிழக வெற்றிக் கழகம்
            </p>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Building a Progressive Tamil Nadu with Youth Power, Education Excellence, and Social Justice
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <VolunteerActivism />
                Join TVK Movement
              </Link>
              <a
                href="#vision"
                className="bg-white text-red-600 border-2 border-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <AutoAwesome />
                Our Vision 2026
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">32</div>
              <div className="text-gray-600">Districts</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600">234</div>
              <div className="text-gray-600">Constituencies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">100K+</div>
              <div className="text-gray-600">Volunteers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600">2026</div>
              <div className="text-gray-600">Victory Target</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-xl text-white/90 max-w-4xl mx-auto">
            "Pirappokkum Ella Uyirkkum" - All Lives are Equal by Birth
          </p>
          <p className="text-lg text-white/80 mt-4 max-w-3xl mx-auto">
            To create a corruption-free, progressive Tamil Nadu where youth lead the change,
            education empowers every citizen, and social justice prevails for all.
          </p>
        </div>
      </section>

      {/* Key Focus Areas */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Key Focus Areas
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Transforming Tamil Nadu through targeted development
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-red-600">
              <School className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Education Revolution</h3>
              <p className="text-gray-600">
                Free quality education, skill development centers in every constituency,
                and digital literacy for all.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-yellow-500">
              <Groups className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Youth Empowerment</h3>
              <p className="text-gray-600">
                Creating 10 lakh jobs, startup ecosystem support, and youth participation
                in governance.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-red-600">
              <HealthAndSafety className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Healthcare for All</h3>
              <p className="text-gray-600">
                Free healthcare services, upgraded PHCs in villages, and health insurance
                for every family.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-yellow-500">
              <Agriculture className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Farmer Welfare</h3>
              <p className="text-gray-600">
                Direct procurement, fair MSP, organic farming support, and agricultural
                modernization.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-red-600">
              <Work className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Industrial Growth</h3>
              <p className="text-gray-600">
                Attracting investments, MSME support, industrial corridors, and
                sustainable development.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-yellow-500">
              <AccountBalance className="w-12 h-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clean Governance</h3>
              <p className="text-gray-600">
                Zero tolerance for corruption, transparent administration, and
                citizen-centric services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Digital Campaign Platform
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Advanced tools for modern political campaigning
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Constituency Analytics
                </h3>
                <p className="text-gray-600">
                  Real-time voter sentiment analysis and demographic insights for all 234 constituencies.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Groups className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Volunteer Management
                </h3>
                <p className="text-gray-600">
                  Coordinate and track activities of grassroots volunteers across Tamil Nadu.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Campaign className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Social Media War Room
                </h3>
                <p className="text-gray-600">
                  Monitor and manage digital campaigns across all social media platforms.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <LocationCity className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Booth Level Management
                </h3>
                <p className="text-gray-600">
                  Organize and track booth-level activities and voter outreach programs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision 2026 */}
      <section id="vision" className="py-20 bg-gradient-to-br from-red-50 via-yellow-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Vision Tamil Nadu 2026
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Our roadmap to transform Tamil Nadu into India's leading state
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-red-600 mb-4">Economic Development</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  Make Tamil Nadu a $1 trillion economy by 2030
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  Create 10 lakh new jobs for youth
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  Establish TN as global manufacturing hub
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  Support 50,000 startups and MSMEs
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-yellow-600 mb-4">Social Justice</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Equal opportunities for all communities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Women's safety and empowerment programs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Reservation in private sector jobs
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Universal basic income for poor families
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-red-600 mb-4">Infrastructure</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  Metro rail in all major cities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  24/7 electricity and water supply
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  World-class roads and highways
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">•</span>
                  Smart cities with digital infrastructure
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-yellow-600 mb-4">Education & Health</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Free education from KG to PG
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  AIIMS-level hospitals in every district
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Skill development centers in all blocks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  Free healthcare for all citizens
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-yellow-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Be Part of the Victory Movement
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of volunteers working towards Tamil Nadu's transformation
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            <VolunteerActivism />
            Register as TVK Volunteer
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">TVK Headquarters</h3>
              <p className="text-gray-400">
                Chennai, Tamil Nadu<br />
                Email: contact@tvkparty.in<br />
                Phone: 1800-TVK-2026
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-yellow-400">About TVK</a></li>
                <li><a href="#" className="hover:text-yellow-400">Our Leader</a></li>
                <li><a href="#" className="hover:text-yellow-400">Manifesto</a></li>
                <li><a href="#" className="hover:text-yellow-400">Join Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Connect With Us</h3>
              <p className="text-gray-400 mb-4">
                Follow us on social media for latest updates
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-yellow-400">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-yellow-400">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-yellow-400">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-yellow-400">YouTube</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-500">
              © 2025 Tamilaga Vettri Kazhagam. All rights reserved. | Powered by Pulse Intelligence Platform
            </p>
          </div>
        </div>
      </footer>

      {/* ElevenLabs Voice Agent Widget */}
      <elevenlabs-convai
        agent-id={import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_2501k9rprn1de53rm33gjv0hx84e'}
      />
    </div>
  );
};

export default TVKLandingPage;