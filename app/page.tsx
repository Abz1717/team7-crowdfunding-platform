"use client";

import type { Pitch } from "@/lib/types";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { ArrowRight, TrendingUp, Shield, Users, Building2, Play, CheckCircle, BarChart3, BadgePoundSterling, HeartHandshake } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useState, useEffect } from "react";
import { getRandomPitch } from "@/lib/action";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  function getProfitShareRemaining(pitch: Pitch | null) {
    if (!pitch || pitch.profit_share === undefined || pitch.current_amount === undefined || pitch.target_amount === undefined) {
      return "-";
    }
    const remaining = pitch.profit_share * (1 - (pitch.current_amount / pitch.target_amount));
    return remaining > 0 ? `${remaining.toFixed(2)}%` : "0%";
  }

  let startInvestingHref = "/signup";
  if (!isLoading && user) {
    startInvestingHref = user.role === "business" ? "/business" : "/investor";
  }

  const [randomPitch, setRandomPitch] = useState<Pitch | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  }

  function getDaysLeft(endDate?: string) {
    if (!endDate) return "-";
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }
  
useEffect(() => {
  async function fetchPitchAndCount() {
    const [pitchResult, countResult] = await Promise.all([
      getRandomPitch(),
      (await import("@/lib/action")).getActivePitchCount()
    ]);
      if (pitchResult.success && pitchResult.data) {
        setRandomPitch(pitchResult.data);
      }
      if (countResult.success && typeof countResult.count === "number") {
        setLiveCount(countResult.count);
      }
  }
  fetchPitchAndCount();
}, []);


  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/LandingPageBusinessLounge.jpeg"
            alt="investor"
            className=" w-full h-full object-cover object-center"
          />
          <div className=" absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent "></div>
        </div>

        <div className="relative z-10 h-full flex items-center ">
          <div className="container mx-auto px-4 ">
            <div className="grid lg:grid-cols-2 gap-12 items-center h-full ">

              <div className=" space-y-8 max-w-xl">
                <div className="space-y-6">

                  <Badge className="bg-blue-600 text-white border-blue-600 text-sm font-medium px-4 py-2 ">
                    <Shield className="w-3 h-3 mr-1" />
                    UK Investment Platform
                  </Badge>

                  <h1 className="text-5xl lg:text-6xl font-bold text-white text-balance leading-tight">
                    Earn up to <span className="text-blue-400"> </span> returns investing in UK businesses
                  </h1>

                  <p className="text-xl text-white/90 text-pretty leading-relaxed">
                    Direct investment opportunities in UK small businesses. Fixed returns, monthly payouts,
                    full transparency.
                  </p>
                </div>

                <div className="grid grid-cols-3   gap-6 py-6">

                  <div className="text-center">
                    <div className="text-2xl font-bold text-white"></div>
                    <div className="text-sm text-white opacity-70">Total Funded</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-white "></div>
                    <div className="text-sm text-white opacity-70">Active Investors</div>
                  </div>

                  <div className="text-center">
                      <div className="text-2xl font-bold text-white"></div>
                      <div className="text-sm text-white opacity-70">Avg. ROI</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {isLoading ? null : (
                    <Link href={startInvestingHref}>
                      <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
                        Start Investing
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 bg-black/20 text-white border-white/30 hover:bg-black/30"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch How It Works
                  </Button>
                </div>
              </div>

              <div className=" space-y-4 lg:ml-auto ">

                <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-sm ml-auto mb-4 scale-90 origin-top-left h-42">
                  <CardContent className="p-4">
                    <div className="scale-80 origin-top-left">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xl font-bold text-gray-700">
                          Live
                        </span>
                      </div>

                      <div className="mb-2 pl-4">
                        <div className="text-4xl font-extrabold text-blue-700 mb-1">
                          {liveCount !== null ? liveCount : '-'}
                        </div>
                        <div className="text-lg text-green-600 font-semibold">
                          Investment Opportunities
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-xl max-w-sm mb-4 scale-90 origin-top-left">
                                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex  items-center gap-3 ">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-15 h-7 text-white" />
                        </div>
                     <div>
                          <h3 className="font-semibold text-gray-900">{randomPitch?.title || '-'}</h3>
                          <p className="text-sm text-gray-500">{
                            randomPitch?.elevator_pitch
                              ? randomPitch.elevator_pitch.split('. ')[0] + (randomPitch.elevator_pitch.includes('.') ? '.' : '')
                              : '-'
                          }</p>
                    </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-3 py-1 rounded-full">
                        {randomPitch?.status || ''}
                      </Badge>
                      </div>

                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">  {randomPitch ? getProfitShareRemaining(randomPitch) : "-"}</div>
                        <div className="text-xs text-gray-500">Share Remaining</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{randomPitch?.end_date ? `${getDaysLeft(randomPitch.end_date)} days left` : '-'}</div>
                        <div className="text-xs text-gray-500">Funding Period</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-green-600">{randomPitch?.current_amount !== undefined && randomPitch?.target_amount ? `${Math.round((randomPitch.current_amount / randomPitch.target_amount) * 100)}%` : '-'}</div>
                        <div className="text-xs text-gray-500">Funded</div>
                      </div>
                    </div>

                    <Progress
                    value={randomPitch?.current_amount !== undefined && randomPitch?.target_amount
                      ? Math.round((randomPitch.current_amount / randomPitch.target_amount) * 100)
                        : 0
                    }
                    className="h-2 mb-2"
                    />
                    <div className="text-xs text-gray-500"></div>
                  </CardContent>
                </Card>

                <Card className="max-w-sm bg-white/95 backdrop-blur-sm border-0 shadow-xl ml-auto scale-90 origin-top-left">

                                  <CardContent  className="p-4">
                    <div className=" text-center" >
                      <div className="text-sm font-medium text-gray-600 mb-3">Investment Calculator</div>
                      <div className="mb-4">
                        <div className="text-lg  text-gray-700 mb-2">£ invested</div>
                        <div className=" text-2xl text-green-600 font-bold mb-2">£</div>
                        <div className="text-xs text-gray-500 ">After  at </div>
                      </div>
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        Calculate Your Returns
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">Why Invest With Us?</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Transparent, reliable, and designed to support investors and businesses
              </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            <Card className="text-center p-8 shadow-lg hover:shadow-xl transition-shadow border-slate-200">
              <div className="mb-6 flex items-center justify-center mx-auto bg-green-100 rounded-full w-16 h-16">
                <BadgePoundSterling className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl mb-2">0% fees</div>
              <div className ="text-slate-500 mb-4">fueling businesses, rewarding investors</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Capital Meets Vision</h3>
              <p className ="text-slate-600 leading-relaxed">
                Businesses get funded, investors back the next big thing — with full transparency.
              </p>
            </Card>

            <Card className="text-center p-8 shadow-lg hover:shadow-xl transition-shadow border-slate-200 ">
              <div className="mb-4 flex items-center justify-center mx-auto bg-purple-100 rounded-full w-16 h-16">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl mb-2"></div>
              <div className ="text-slate-500 mb-4">invest with confidence</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Spot the Next Big Thing</h3>
              <p className="text-slate-600 leading-relaxed">
                Back promising businesses early and grow your wealth with predictable, transparent returns.
              </p>
            </Card>

            <Card className="text-center p-8 shadow-lg hover:shadow-xl transition-shadow border-slate-200">
              <div className="mb-4 flex items-center justify-center mx-auto bg-blue-100 rounded-full w-16 h-16">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl mb-2"></div>
              <div className ="text-slate-500 mb-4">funding made simple</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3" >Get Funded Faster</h3>
              <p className="text-slate-600 leading-relaxed">
                Create pitches, connect with motivated investors, and secure the capital your business needs to grow.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl">How We Work</h2>
            <p className="text-xl">
              A transparent, reliable process connecting businesses with investors
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mb-4">
                <Building2 className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-lg mb-3">Business Application</h3>
              <p>
                UK businesses submit funding requests for growth projects and equipment purchases
                </p>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <Shield className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-lg mb-3">Due Diligence</h3>
              <p>
                Multi-stage due diligence ensures only quality projects advance
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <BarChart3 className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-lg mb-3">Risk Assessment</h3>
              <p>
                Risk assessments conducted in full compliance with UK regulatory standards
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <Users className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-lg mb-3">Investor Funding</h3>
              <p>
                Investors provide funding to verified projects, starting from just £50
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">

        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl">What Our Investors Say</h2>
            <p className="text-xl">
              Fake stories from investors earning consistent returns with us
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            <Card className="p-6">
              <div className="mb-4">
                <div className="flex mb-4">

                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}

                </div>
                <p className="mb-4">
                  "Great platform with consistent returns. I've been investing for 6 months and very happy with the results."
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mr-4">
                  IC
                </div>
                <div>
                  <div>Iker Casillas</div>
                  <div className="text-sm">Portfolio: £2,500 • Returns: 8.5%</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <div className="flex mb-4">

                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}

                </div>
                <p className="mb-4">
                  "Transparent process and monthly payouts as promised. Excellent customer service team."
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mr-4">
                  CR
                </div>
                <div>
                  <div>Cristiano Ronaldo</div>
                  <div className="text-sm">Portfolio: £5,000 • Returns: 9.2%</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4">
                <div className="flex mb-4">

                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}

                </div>
                <p className="mb-4">
                  "Started with £50 to test the platform. Now investing much more after seeing the consistent results."
                  </p>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white mr-4">
                  RB
                </div>
                <div>
                  <div>Roberto Baggio</div>
                  <div className="text-sm">Portfolio: £1,200 • Returns: 7.8%</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>4.8/5 average rating</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>215+ active investors</span>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>130+ successfully funded</span>
              </div>
            </div>
          </div>

        </div>
      </section>



      


      



      <footer className="border-t py-12 px-4 bg-white">
        <div className="container mx-auto text-center">
          <div className="text-2xl font-bold text-blue-600 mb-4">Invex</div>
            <p className="text-slate-600 mb-4">UK investment platform connecting businesses with investors</p>
            <p className="text-sm text-slate-500">
              Invex © 2025
            </p>
        </div>
      </footer>
    </div>
  )
}