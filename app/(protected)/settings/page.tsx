'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/app/auth-context';
import { useTheme } from '@/app/theme-context';
import { TopNav } from '@/components/top-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { themePresets, accentColors, ThemeStyle, AccentColor } from '@/lib/theme-presets';
import { Check, Palette, Zap, Sparkles, Camera, Save } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/lib/error-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, updateTheme, applyThemePreset } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'security'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is Business Intelligence
  const canEditProfile = user?.department === 'Business Intelligence';

  const handleThemeStyleChange = (style: ThemeStyle) => {
    applyThemePreset(style);
  };

  const handleAccentColorChange = (color: AccentColor) => {
    updateTheme({ accentColor: color });
  };

  const handleAnimationChange = (animated: boolean) => {
    updateTheme({ animationStyle: animated ? 'animated' : 'simple' });
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast({ message: 'Image size must be less than 5MB', retryable: false });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showErrorToast({ message: 'Please select an image file', retryable: false });
        return;
      }

      // Convert to base64 and update user avatar
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await updateUser({ avatar: base64String });
        showSuccessToast('Profile image updated successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!canEditProfile) {
      showErrorToast({ message: 'Only Business Intelligence users can edit profile information', retryable: false });
      return;
    }

    await updateUser({
      name: profileData.name,
      email: profileData.email,
    });
    setIsEditingProfile(false);
    showSuccessToast('Profile updated successfully');
  };

  const handleCancelEdit = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditingProfile(false);
  };

  return (
    <>
      <TopNav title="Settings" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold transition-colors duration-300" style={{ color: 'var(--theme-text)' }}>
            Profile Settings
          </h2>
          <p className="transition-colors duration-300" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
            Manage your identity, security, and interface preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--theme-border)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-t-lg transition-all duration-300 ${
              activeTab === 'profile' ? 'font-semibold' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'profile' ? 'var(--theme-surface)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--theme-accent)' : 'var(--theme-text)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--theme-accent)' : 'none',
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2 rounded-t-lg transition-all duration-300 ${
              activeTab === 'theme' ? 'font-semibold' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'theme' ? 'var(--theme-surface)' : 'transparent',
              color: activeTab === 'theme' ? 'var(--theme-accent)' : 'var(--theme-text)',
              borderBottom: activeTab === 'theme' ? '2px solid var(--theme-accent)' : 'none',
            }}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            Theme Customization
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-t-lg transition-all duration-300 ${
              activeTab === 'security' ? 'font-semibold' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'security' ? 'var(--theme-surface)' : 'transparent',
              color: activeTab === 'security' ? 'var(--theme-accent)' : 'var(--theme-text)',
              borderBottom: activeTab === 'security' ? '2px solid var(--theme-accent)' : 'none',
            }}
          >
            Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Profile Information</h3>
            
            {/* Profile Image */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleProfileImageClick}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <button
                  onClick={handleProfileImageClick}
                  className="absolute bottom-0 right-0 p-2 rounded-full transition-colors"
                  style={{ backgroundColor: 'var(--theme-accent)', color: '#ffffff' }}
                  title="Change profile picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--theme-text)' }}>{user?.name}</p>
                <p className="text-sm" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>{user?.department}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-text)', opacity: 0.5 }}>
                  Click the camera icon to change your profile picture
                </p>
              </div>
            </div>

            {!canEditProfile && (
              <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                <p className="text-sm">
                  Only Business Intelligence users can edit profile information. You can still update your profile picture.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Staff ID</label>
                <Input
                  value={user?.staffId || ''}
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Name</label>
                <Input
                  value={isEditingProfile ? profileData.name : user?.name || ''}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                  readOnly={!isEditingProfile}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Email</label>
                <Input
                  value={isEditingProfile ? profileData.email : user?.email || ''}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                  readOnly={!isEditingProfile}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Department</label>
                <Input
                  value={user?.department || ''}
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Role</label>
                <Input
                  value={user?.role || ''}
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                  readOnly
                />
              </div>

              {canEditProfile && (
                <div className="flex gap-2 pt-4">
                  {!isEditingProfile ? (
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      className="transition-all duration-300"
                      style={{
                        backgroundColor: 'var(--theme-accent)',
                        color: '#ffffff',
                      }}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        className="transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: '#ffffff',
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        className="transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--theme-background)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text)',
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Theme Customization Tab */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            {/* Theme Style Selection */}
            <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                <Palette className="w-5 h-5" />
                Theme Style
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                Choose your preferred interface style
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(themePresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleThemeStyleChange(key as ThemeStyle)}
                    className="p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 relative"
                    style={{
                      backgroundColor: theme.style === key ? 'var(--theme-accent)' : 'var(--theme-background)',
                      borderColor: theme.style === key ? 'var(--theme-accent)' : 'var(--theme-border)',
                      color: theme.style === key ? '#ffffff' : 'var(--theme-text)',
                    }}
                  >
                    {theme.style === key && (
                      <Check className="w-5 h-5 absolute top-2 right-2" />
                    )}
                    <div className="font-bold mb-1">{preset.name}</div>
                    <div className="text-xs opacity-70">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Selection */}
            <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                <Sparkles className="w-5 h-5" />
                Accent Color
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                Select your favorite accent color
              </p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {Object.entries(accentColors).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => handleAccentColorChange(key as AccentColor)}
                    className="relative group"
                    title={color.name}
                  >
                    <div
                      className="w-12 h-12 rounded-full border-4 transition-all duration-300 hover:scale-110"
                      style={{
                        backgroundColor: color[theme.mode],
                        borderColor: theme.accentColor === key ? 'var(--theme-text)' : 'transparent',
                      }}
                    />
                    {theme.accentColor === key && (
                      <Check className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
                    )}
                    <div className="text-xs mt-1 text-center" style={{ color: 'var(--theme-text)' }}>
                      {color.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Style */}
            <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                <Zap className="w-5 h-5" />
                Animation Style
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--theme-text)', opacity: 0.7 }}>
                Choose between animated or simple interface
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAnimationChange(true)}
                  className="flex-1 p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: theme.animationStyle === 'animated' ? 'var(--theme-accent)' : 'var(--theme-background)',
                    borderColor: theme.animationStyle === 'animated' ? 'var(--theme-accent)' : 'var(--theme-border)',
                    color: theme.animationStyle === 'animated' ? '#ffffff' : 'var(--theme-text)',
                  }}
                >
                  <Zap className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-bold">Animated</div>
                  <div className="text-xs opacity-70">Smooth transitions & effects</div>
                </button>
                <button
                  onClick={() => handleAnimationChange(false)}
                  className="flex-1 p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: theme.animationStyle === 'simple' ? 'var(--theme-accent)' : 'var(--theme-background)',
                    borderColor: theme.animationStyle === 'simple' ? 'var(--theme-accent)' : 'var(--theme-border)',
                    color: theme.animationStyle === 'simple' ? '#ffffff' : 'var(--theme-text)',
                  }}
                >
                  <div className="w-6 h-6 mx-auto mb-2 border-2 rounded" style={{ borderColor: 'currentColor' }} />
                  <div className="font-bold">Simple</div>
                  <div className="text-xs opacity-70">Minimal animations</div>
                </button>
              </div>
            </div>

            {/* Current Theme Preview */}
            <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Current Theme</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Style:</span>
                  <span className="ml-2 font-semibold" style={{ color: 'var(--theme-text)' }}>
                    {themePresets[theme.style].name}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Mode:</span>
                  <span className="ml-2 font-semibold capitalize" style={{ color: 'var(--theme-text)' }}>
                    {theme.mode}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Accent:</span>
                  <span className="ml-2 font-semibold" style={{ color: 'var(--theme-text)' }}>
                    {accentColors[theme.accentColor].name}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--theme-text)', opacity: 0.7 }}>Animation:</span>
                  <span className="ml-2 font-semibold capitalize" style={{ color: 'var(--theme-text)' }}>
                    {theme.animationStyle}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="rounded-xl p-6 border transition-colors duration-300" style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>Security & Access</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text)' }}>New Password</label>
                <Input
                  type="password"
                  placeholder="Min. 12 characters"
                  className="transition-colors duration-300"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
              <Button
                className="mt-4 transition-all duration-300"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: '#ffffff',
                }}
              >
                Update Password
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
