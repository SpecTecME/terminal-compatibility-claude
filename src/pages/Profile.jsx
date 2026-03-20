/**
 * Profile Page (User Profile Management)
 * 
 * PURPOSE:
 * Personal profile editor for contact information and avatar.
 * Uses base44.auth.updateMe() to persist data on User entity.
 * 
 * THREE SECTIONS:
 * 1. Personal Information (with photo)
 * 2. Contact Information
 * 3. Address
 * 
 * ========================================
 * PERSONAL INFORMATION (lines 115-213)
 * ========================================
 * 
 * PROFILE PHOTO (lines 123-147):
 * 
 * DISPLAY (lines 126-133):
 * - If uploaded: Show image (rounded, bordered)
 * - If not: Gradient circle with initial letter
 * 
 * UPLOAD FLOW (lines 135-145):
 * Camera icon button over avatar.
 * Hidden file input triggered on click.
 * 
 * UPLOAD HANDLER (lines 82-96):
 * 1. User selects image file
 * 2. Uploads via Core.UploadFile integration
 * 3. Gets file_url back
 * 4. Updates profile.profile_photo state
 * 5. Shows uploading indicator
 * 
 * AVATAR FALLBACK:
 * Uses first letter of full_name.
 * Gradient background (cyan to blue).
 * Accessible when no photo.
 * 
 * DISPLAY NAME (line 149-157):
 * How user wants to be addressed.
 * Can differ from legal name.
 * Example: "Mike" instead of "Michael".
 * 
 * PREFERRED LANGUAGE (line 158-173):
 * Language preference selector.
 * 
 * OPTIONS:
 * - English, Arabic, Spanish, French, German, Chinese, Japanese
 * 
 * NATIVE SCRIPT:
 * Shows language in both English and native script.
 * Helps non-English speakers find their language.
 * 
 * FUTURE USE:
 * Could drive UI language (currently not implemented).
 * 
 * FIRST/LAST NAME (lines 176-193):
 * Structured name fields.
 * Alternative to single full_name.
 * 
 * COMPANY/POSITION (lines 194-211):
 * Organizational context.
 * Free-text (no validation against Company entity).
 * 
 * ========================================
 * CONTACT INFORMATION (lines 215-263)
 * ========================================
 * 
 * EMAIL (line 224-232):
 * DISABLED field (line 228).
 * 
 * CANNOT CHANGE EMAIL:
 * - Email is login identifier
 * - Changing would break authentication
 * - Admin must update via user management
 * 
 * HELP TEXT (line 231):
 * "Email cannot be changed" clarifies restriction.
 * 
 * PHONE/MOBILE (lines 233-252):
 * Two phone number fields.
 * 
 * DISTINCTION:
 * - Phone: Office/desk phone
 * - Mobile: Personal/mobile phone
 * 
 * Used for SMS MFA and contact purposes.
 * 
 * WEBSITE (line 253-261):
 * Personal or company website.
 * Optional field.
 * 
 * ========================================
 * ADDRESS (lines 265-320)
 * ========================================
 * 
 * ADDRESS TYPE (line 274-283):
 * Work or Private.
 * 
 * Helps contextualize the address.
 * Some users prefer work address, some personal.
 * 
 * STANDARD ADDRESS FIELDS:
 * - Street Address (line 285-292)
 * - City (line 294-301)
 * - Zip Code (line 302-309)
 * - Country (line 310-317)
 * 
 * FREE-TEXT:
 * Not linked to Country entity.
 * User types country name (no validation).
 * 
 * RATIONALE:
 * Personal address, not business data.
 * No need for referential integrity.
 * 
 * PERSISTENCE (lines 67-80):
 * Uses base44.auth.updateMe().
 * 
 * SPECIAL METHOD:
 * Updates current user's User entity record.
 * Cannot override built-in fields (id, email, full_name, role).
 * Can add custom profile fields.
 * 
 * STATE INITIALIZATION (lines 36-65):
 * Loads user via getCurrentUserCached.
 * Pre-fills form with existing data.
 * Empty strings for missing fields (not null).
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save, Mail, Phone, Building2, Globe, MapPin, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUserCached } from '../components/utils/currentUser';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    display_name: '',
    profile_photo: '',
    preferred_language: 'en',
    first_name: '',
    last_name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address_type: 'work',
    address: '',
    city: '',
    zip_code: '',
    country: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserCached();
        setUser(userData);
        // Pre-fill profile with existing data
        setProfile({
          display_name: userData.display_name || '',
          profile_photo: userData.profile_photo || '',
          preferred_language: userData.preferred_language || 'en',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          company: userData.company || '',
          position: userData.position || '',
          email: userData.email,
          phone: userData.phone || '',
          mobile: userData.mobile || '',
          website: userData.website || '',
          address_type: userData.address_type || 'work',
          address: userData.address || '',
          city: userData.city || '',
          zip_code: userData.zip_code || '',
          country: userData.country || ''
        });
      } catch (e) {
        toast.error('Failed to load profile');
      }
    };
    loadUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate(profile);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setProfile({ ...profile, profile_photo: result.file_url });
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and contact details</p>
      </div>

      {/* Personal Information */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white border-2 border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
              {uploadingPhoto && <p className="text-xs text-gray-600">Uploading...</p>}
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Display Name</Label>
                <Input
                  value={profile.display_name}
                  onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                  placeholder="How you'd like to be called"
                  className="bg-white border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Preferred Language</Label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={profile.preferred_language}
                  onChange={(e) => setProfile({...profile, preferred_language: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="zh">Chinese (中文)</option>
                  <option value="ja">Japanese (日本語)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">First Name</Label>
              <Input
                value={profile.first_name}
                onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Last Name</Label>
              <Input
                value={profile.last_name}
                onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Company</Label>
              <Input
                value={profile.company}
                onChange={(e) => setProfile({...profile, company: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Position</Label>
              <Input
                value={profile.position}
                onChange={(e) => setProfile({...profile, position: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Email</Label>
            <Input
              value={profile.email}
              disabled
              className="bg-gray-100 border-gray-300"
            />
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Phone</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                placeholder="+1234567890"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Mobile</Label>
              <Input
                value={profile.mobile}
                onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                placeholder="+1234567890"
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">Website</Label>
            <Input
              value={profile.website}
              onChange={(e) => setProfile({...profile, website: e.target.value})}
              placeholder="https://example.com"
              className="bg-white border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Address Type</Label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={profile.address_type}
              onChange={(e) => setProfile({...profile, address_type: e.target.value})}
            >
              <option value="work">Work</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">Street Address</Label>
            <Input
              value={profile.address}
              onChange={(e) => setProfile({...profile, address: e.target.value})}
              className="bg-white border-gray-300"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-700">City</Label>
              <Input
                value={profile.city}
                onChange={(e) => setProfile({...profile, city: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Zip Code</Label>
              <Input
                value={profile.zip_code}
                onChange={(e) => setProfile({...profile, zip_code: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Country</Label>
              <Input
                value={profile.country}
                onChange={(e) => setProfile({...profile, country: e.target.value})}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateProfileMutation.isPending}
          className="bg-gradient-to-r from-cyan-500 to-blue-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}