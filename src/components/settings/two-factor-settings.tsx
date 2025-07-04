'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, QrCode, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  twoFactorEnabled?: boolean;
}

interface TwoFactorSettingsProps {
  user: User;
  onUpdate?: () => void;
}

interface SetupData {
  secret: string;
  qrCodeDataUrl: string;
  manualEntryKey: string;
  serviceName: string;
  accountName: string;
}

export function TwoFactorSettings({ user, onUpdate }: TwoFactorSettingsProps): JSX.Element {
  const t = useTranslations('settings.security.twoFactor');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [currentTwoFactorEnabled, setCurrentTwoFactorEnabled] = useState(
    user.twoFactorEnabled ?? false,
  );

  // Sync local state with user prop changes
  useEffect(() => {
    setCurrentTwoFactorEnabled(user.twoFactorEnabled ?? false);
  }, [user.twoFactorEnabled]);

  const handleStartSetup = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to setup 2FA');
      }

      const data = (await response.json()) as SetupData;
      setSetupData(data);
      setShowSetupDialog(true);
      setStep('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (): Promise<void> => {
    if (!setupData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationToken,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to enable 2FA');
      }

      setSuccess('Two-factor authentication has been enabled successfully!');
      setCurrentTwoFactorEnabled(true);
      setShowSetupDialog(false);
      setVerificationToken('');
      setSetupData(null);
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: disableToken,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? 'Failed to disable 2FA');
      }

      setSuccess('Two-factor authentication has been disabled.');
      setCurrentTwoFactorEnabled(false);
      setShowDisableDialog(false);
      setDisableToken('');
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetState = (): void => {
    setError(null);
    setSuccess(null);
    setVerificationToken('');
    setDisableToken('');
    setStep('setup');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error != null && error !== '' && (
          <div className="flex items-center rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}

        {success != null && success !== '' && (
          <div className="flex items-center rounded-md bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {success}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t('status')}</p>
            <p className="text-sm text-muted-foreground">{t('statusDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentTwoFactorEnabled ? (
              <span className="flex items-center text-sm font-medium text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {t('enabled')}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{t('disabled')}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {currentTwoFactorEnabled ? (
            <Dialog
              open={showDisableDialog}
              onOpenChange={(open) => {
                setShowDisableDialog(open);
                if (!open) resetState();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {t('disableButton')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('disableTitle')}</DialogTitle>
                  <DialogDescription>{t('disableDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="disable-token">{t('verificationCode')}</Label>
                    <Input
                      id="disable-token"
                      type="text"
                      placeholder="123456"
                      value={disableToken}
                      onChange={(e) =>
                        setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                    <p className="text-sm text-muted-foreground">{t('enterCode')}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDisableDialog(false)}
                      disabled={loading}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisable}
                      disabled={loading || disableToken.length !== 6}
                    >
                      {loading ? t('disabling') : t('confirm')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={handleStartSetup} disabled={loading} size="sm">
              {loading ? t('setting') : t('enableButton')}
            </Button>
          )}
        </div>

        {/* Setup Dialog */}
        <Dialog
          open={showSetupDialog}
          onOpenChange={(open) => {
            setShowSetupDialog(open);
            if (!open) {
              resetState();
              setSetupData(null);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                {t('setupTitle')}
              </DialogTitle>
              <DialogDescription>
                {step === 'setup' ? t('setupDescription') : t('verifyDescription')}
              </DialogDescription>
            </DialogHeader>

            {setupData && (
              <div className="space-y-4">
                {step === 'setup' && (
                  <>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="rounded-lg border bg-white p-4">
                        <Image
                          src={setupData.qrCodeDataUrl}
                          alt="2FA QR Code"
                          width={192}
                          height={192}
                          className="h-48 w-48"
                        />
                      </div>

                      <div className="space-y-2 text-center">
                        <p className="text-sm font-medium">{t('scanInstructions')}</p>
                        <p className="text-xs text-muted-foreground">{t('manualEntry')}</p>
                        <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                          {setupData.manualEntryKey}
                        </code>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => setStep('verify')}>{t('next')}</Button>
                    </div>
                  </>
                )}

                {step === 'verify' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="verification-token">{t('verificationCode')}</Label>
                      <Input
                        id="verification-token"
                        type="text"
                        placeholder="123456"
                        value={verificationToken}
                        onChange={(e) =>
                          setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                      <p className="text-sm text-muted-foreground">{t('enterCode')}</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setStep('setup')} disabled={loading}>
                        {t('back')}
                      </Button>
                      <Button
                        onClick={handleVerifyAndEnable}
                        disabled={loading || verificationToken.length !== 6}
                      >
                        {loading ? t('enabling') : t('enable')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
