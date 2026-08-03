import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Lock, Eye, EyeOff, Moon, Globe, Shield, Trash2, Save, Loader, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import MobileBottomNav from '../../components/website/MobileBottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { getUserSettings, updateUserSettings, changePassword, deleteAccount } from '../../utils/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: true,
      push: true,
      marketing: false
    },
    privacy: {
      profileVisible: true,
      showPhone: false,
      showEmail: false
    },
    preferences: {
      darkMode: false,
      language: 'en'
    }
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await getUserSettings();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await updateUserSettings(settings);
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setMessage({ type: 'error', text: 'Please fill all password fields' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwords.new.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    try {
      const result = await changePassword(passwords.current, passwords.new);
      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }

    try {
      const result = await deleteAccount(deletePassword);
      if (result.success) {
        logout();
        navigate('/');
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to delete account' });
        setShowDeleteModal(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete account' });
      setShowDeleteModal(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Use languages from translation context
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' }
  ];

  const settingSections = [
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        { key: 'email', label: 'Email Notifications', desc: 'Receive booking updates via email' },
        { key: 'sms', label: 'SMS Notifications', desc: 'Get text messages for important alerts' },
        { key: 'push', label: 'Push Notifications', desc: 'Browser notifications for new messages' },
        { key: 'marketing', label: 'Marketing Emails', desc: 'Receive offers and promotions' }
      ]
    },
    {
      title: 'Privacy',
      icon: Shield,
      settings: [
        { key: 'profileVisible', label: 'Public Profile', desc: 'Make your profile visible to others' },
        { key: 'showPhone', label: 'Show phone number', desc: 'Display phone on your profile' },
        { key: 'showEmail', label: 'Show Email', desc: 'Display email on your profile' }
      ]
    }
  ];

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, language: langCode }
    }));
    setShowLanguageDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />

      <main className="pt-20 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/website/mystays" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Settings Sections */}
          {settingSections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {section.settings.map((setting) => {
                  const category = section.title.toLowerCase();
                  const isEnabled = settings[category][setting.key];

                  return (
                    <div key={setting.key} className="p-6 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{setting.label}</p>
                        <p className="text-sm text-gray-500">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(category, setting.key)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          isEnabled ? 'bg-teal-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                          isEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {['current', 'new', 'confirm'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword[field] ? 'text' : 'password'}
                      name={field}
                      value={passwords[field]}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all pr-12"
                      placeholder={`Enter ${field} password`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword[field] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handlePasswordUpdate}
                disabled={saving}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Dark Mode</p>
                    <p className="text-sm text-gray-500">Switch to dark theme</p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    darkMode ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="w-full p-6 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Language</p>
                      <p className="text-sm text-gray-500">
                        {languages.find(l => l.code === settings.preferences.language)?.name || 'English'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showLanguageDropdown ? 'rotate-90' : ''}`} />
                </button>

                {/* Language Dropdown */}
                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-10 max-h-64 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full px-6 py-3 text-left flex items-center justify-between hover:bg-gray-50 ${
                          settings.preferences.language === lang.code ? 'bg-teal-50 text-teal-700' : ''
                        }`}
                      >
                        <span>{lang.name}</span>
                        {settings.preferences.language === lang.code && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-red-50 rounded-2xl shadow-sm mb-6 overflow-hidden border border-red-200">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-red-900">Delete Account</h2>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-20 md:bottom-0 bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save All Settings
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Account?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. Enter your password to confirm.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}


