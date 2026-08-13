import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchJson, getAuthHeader } from '../../utils/api';

const PaymentGateway = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState(1); // 1: Identity, 2: Mode Select, 3: OTP Verification, 4: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loginId, setLoginId] = useState('');

    // Data from backend after identity verification
    const [propertyData, setPropertyData] = useState(null);

    // OTP State
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(''); // 'cash' | 'already_paid_online'

    useEffect(() => {
        if (!token) {
            setError('Invalid link. Token is missing.');
            return;
        }

        // Dynamically load Cashfree JS SDK script if not already present
        if (typeof window !== 'undefined' && !window.Cashfree) {
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.async = true;
            document.body.appendChild(script);
        }

        // Auto-extract loginId from JWT token and skip Step 1
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload?.loginId) {
                setLoginId(payload.loginId);
                setLoading(true);
                fetchJson('/api/rents/payment-page/verify-identity', {
                    method: 'POST',
                    body: JSON.stringify({ token, enteredLoginId: payload.loginId })
                })
                    .then(data => {
                        setPropertyData(data);
                        setStep(2);
                    })
                    .catch(err => {
                        setError(err.message || 'Could not connect to server.');
                    })
                    .finally(() => setLoading(false));
            }
        } catch (_) {
            // token decode failed — stay on step 1 for manual entry
        }
    }, [token]);

    const handleVerifyIdentity = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await fetchJson('/api/rents/payment-page/verify-identity', {
                method: 'POST',
                body: JSON.stringify({ token, enteredLoginId: loginId })
            });

            setPropertyData(data);
            setStep(2); // Proceed to Payment Mode Selection
        } catch (err) {
            setError(err.message || 'Identity verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleOnlinePayment = async () => {
        setError(null);
        setLoading(true);

        try {
            // 1. Get Cashfree Order / Payment Link
            const data = await fetchJson('/api/payments/cashfree/create-order', {
                method: 'POST',
                body: JSON.stringify({
                    bookingId: propertyData?.bookingId || propertyData?._id || token,
                    amount: propertyData?.rentAmount || propertyData?.amount || 0,
                    customerInfo: {
                        name: propertyData?.tenantName || 'Tenant',
                        phone: propertyData?.tenantPhone || '',
                        email: propertyData?.tenantEmail || ''
                    }
                })
            });

            const paymentSessionId = data.payment_session_id;
            const paymentLink = data.payment_link || data.link_url;

            // 2. Open Cashfree SDK or Redirect
            if (typeof window.Cashfree === 'function' && paymentSessionId) {
                const cashfree = window.Cashfree({ mode: 'sandbox' });
                cashfree.checkout({
                    paymentSessionId: paymentSessionId,
                    redirectTarget: '_self'
                });
            } else if (paymentLink) {
                window.location.href = paymentLink;
            } else {
                throw new Error('Could not initiate Cashfree checkout session.');
            }

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGenerateCashOtp = async (method) => {
        setError(null);
        setLoading(true);
        // Set payment method immediately from the parameter — avoids React
        // state-batching issues where setState hasn't flushed yet.
        setSelectedPaymentMethod(method || 'cash');
        try {
            const data = await fetchJson('/api/rents/cash-otp/generate', {
                method: 'POST',
                body: JSON.stringify({ token })
            });
            setOtpSent(true);
            setStep(3); // Enter OTP Mode
        } catch (err) {
            setError(err.message || 'Failed to generate OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCashOtp = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await fetchJson('/api/rents/cash-otp/verify', {
                method: 'POST',
                // 'already_paid_online' maps to 'online' so receipts show Online Payment
                body: JSON.stringify({
                    token,
                    otp,
                    paymentMethod: selectedPaymentMethod === 'already_paid_online' ? 'online' : selectedPaymentMethod
                })
            });
            setStep(4); // Success!
        } catch (err) {
            setError(err.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };


    if (loading && step === 1) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">Loading payment details...</p>
                </div>
            </div>
        );
    }

    if (step === 0) {
        // Hard stop error
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Link Unavailable</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/tenant/tenantlogin')} className="w-full bg-slate-800 text-white py-3 rounded-lg font-semibold cursor-pointer">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-md w-full relative">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-center text-white">
                    <h1 className="text-2xl font-bold">RoomHy</h1>
                    <p className="text-purple-100 mt-1 text-sm">Secure Onboarding Payment</p>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {/* STEP 1: IDENTITY VERIFICATION */}
                    {step === 1 && (
                        <form onSubmit={handleVerifyIdentity} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Verify Identity</h2>
                                <p className="text-slate-500 text-sm mt-1">Please enter your exact Tenant Login ID to access this secure payment link.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Tenant Login ID</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase"
                                    placeholder="e.g. TST-53X2..."
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token || !loginId}
                                className="w-full bg-purple-600 hover:bg-purple-700 border border-transparent disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all cursor-pointer flex justify-center"
                            >
                                {loading ? 'Verifying...' : 'Access Payment Page'}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: PAYMENT MODE SELECTION */}
                    {step === 2 && propertyData && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-200">Payment Breakdown</h3>

                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <span className="text-slate-500">Property</span>
                                    <span className="font-semibold text-slate-800 text-right">{propertyData.propertyName}</span>

                                    <span className="text-slate-500">Tenant Info</span>
                                    <span className="font-semibold text-slate-800 text-right">{propertyData.tenantName}</span>

                                    <span className="text-slate-500">Managed By</span>
                                    <span className="font-semibold text-slate-800 text-right">{propertyData.ownerName}</span>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Rent Amount</span>
                                        <span className="font-semibold text-slate-800">₹{(propertyData.rentAmount - (propertyData.advanceAmount || 0)).toLocaleString('en-IN')}</span>
                                    </div>
                                    {propertyData.advanceAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">Move In Charges</span>
                                            <span className="font-semibold text-amber-700">₹{(propertyData.advanceAmount).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                                        <span className="text-slate-600 font-medium">Total Payable</span>
                                        <span className="text-2xl font-black text-green-600">₹{propertyData.rentAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-6">
                                <button
                                    onClick={handleOnlinePayment}
                                    disabled={loading}
                                    className="w-full relative flex items-center justify-between p-4 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-purple-900">Pay Online (Cashfree)</span>
                                        <span className="text-purple-700 text-xs mt-1">UPI, Credit/Debit Card, Netbanking</span>
                                    </div>
                                    <span className="text-purple-600">→</span>
                                </button>

                                <button
                                    onClick={() => handleGenerateCashOtp('cash')}
                                    disabled={loading}
                                    className="w-full relative flex items-center justify-between p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-slate-700">Cash</span>
                                        <span className="text-slate-500 text-xs mt-1">Hand over cash to owner/manager</span>
                                    </div>
                                    <span className="text-slate-400">→</span>
                                </button>

                                <button
                                    onClick={() => handleGenerateCashOtp('already_paid_online')}
                                    disabled={loading}
                                    className="w-full relative flex items-center justify-between p-4 border border-green-200 bg-green-50 hover:bg-green-100 rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-green-900">Already Paid Online</span>
                                        <span className="text-green-700 text-xs mt-1">Payment already done online (UPI/Transfer)</span>
                                    </div>
                                    <span className="text-green-600">→</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: CASH OTP VERIFICATION */}
                    {step === 3 && (
                        <form onSubmit={handleVerifyCashOtp} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800">
                                    {selectedPaymentMethod === 'already_paid_online' ? 'Confirm Online Payment' : 'Cash Payment OTP'}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    {selectedPaymentMethod === 'already_paid_online'
                                        ? 'Owner ko OTP dena hoga jo unke registered number par aaya hai, confirming the online payment.'
                                        : 'Please ask your owner/manager for the secure 6-digit OTP sent to their registered number.'}
                                </p>
                        </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">6-Digit Authorization OTP</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-widest transition-all"
                                    placeholder="------"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-slate-800 hover:bg-black text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Verifying...' : 'Confirm Cash Payment'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={loading}
                                className="w-full text-slate-500 text-sm hover:text-slate-800 cursor-pointer text-center mt-4"
                            >
                                ← Go back to Payment Modes
                            </button>
                        </form>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Payment Successful!</h2>
                            <p className="text-slate-600 mb-6">Your onboarding is complete. We've sent the receipt and login credentials to your email address.</p>

                            <button
                                onClick={() => navigate('/tenant/tenantlogin')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-all cursor-pointer"
                            >
                                Go to Tenant Portal
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Script include for Cashfree */}
            <div className="hidden">
                <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
            </div>

        </div>
    );
};

export default PaymentGateway;
