'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLanguagePreference } from '@/hooks/use-language-preference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { validatePassword } from '@/lib/validation/password';
import { signOut } from 'next-auth/react';

export function AccountSettings() {
  const t = useTranslations('settings.account');
  const tCommon = useTranslations('common');
  const { getCurrentLocale, changeLanguage } = useLanguagePreference();

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change state
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }

    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]);
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      toast.success(t('passwordChangeSuccess'));
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(t('passwordChangeError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingEmail(true);

    try {
      const response = await fetch('/api/user/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEmail: emailForm.newEmail,
          password: emailForm.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change email');
      }

      setEmailForm({ newEmail: '', password: '' });
      toast.success(t('emailChangeSuccess'));
    } catch (error) {
      console.error('Email change error:', error);
      toast.error(t('emailChangeError'));
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error(t('deleteAccountConfirmation.confirmationText'));
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }

      toast.success(t('deleteAccountConfirmation.successMessage'));
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(t('deleteAccountConfirmation.errorMessage'));
      setIsDeletingAccount(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordValidation = validatePassword(passwordForm.newPassword);

  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('language')}</CardTitle>
          <CardDescription>{t('languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select
              value={getCurrentLocale()}
              onValueChange={(value: 'en' | 'ja') => changeLanguage(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t('confirmNewPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmNewPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {passwordForm.newPassword && (
              <Alert className={passwordValidation.isValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                <AlertDescription className="text-sm">
                  {t('passwordRequirements')}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={isChangingPassword || !passwordValidation.isValid || passwordForm.newPassword !== passwordForm.confirmNewPassword}
            >
              {isChangingPassword ? tCommon('loading') : t('changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email Change */}
      <Card>
        <CardHeader>
          <CardTitle>{t('emailChange')}</CardTitle>
          <CardDescription>{t('emailChangeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">{t('newEmail')}</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailPassword">{t('currentPassword')}</Label>
              <Input
                id="emailPassword"
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" disabled={isChangingEmail}>
              {isChangingEmail ? tCommon('loading') : t('changeEmail')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('deleteAccount')}</CardTitle>
          <CardDescription>{t('deleteAccountDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                {t('deleteAccountButton')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t('deleteAccount')}
                </DialogTitle>
                <DialogDescription>
                  {t('deleteAccountConfirm')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('deleteAccountConfirmation.confirmationInstruction')}
                  </AlertDescription>
                </Alert>
                
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={t('deleteAccountConfirmation.confirmationPlaceholder')}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || isDeletingAccount}
                >
                  {isDeletingAccount ? tCommon('loading') : t('deleteAccountButton')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}