import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { ArrowRight, TrendingUp, Shield, Users, Building2, Play, CheckCircle, BarChart3 } from "lucide-react"

export default function HomePage() {
  //connect landing page to real data sources
  // const 
  // {totalFunded, activeInvestors, defaultRate} = usePlatformStats()
  //  {featuredPitch} = useFeaturedPitch()
  //  {testimonials} = useTestimonials()
  //  {live} = useLiveData()
  //  {maxReturn, minInvestment} = usePlatformConfig()

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/LandingPageBusinessLounge.jpeg"
            alt="investor"
            className=" w-full h-full object-cover object-center"
          />
          <div className=" absolute inset-0 bg-black opacity-40 "></div>
        </div>

        <div className="relative z-10 h-full flex items-center ">
          <div className="container mx-auto px-4 ">
            <div className="grid lg:grid-cols-2 gap-12 items-center h-full ">

              <div className="max-w-xl">
                <div className="mb-6">
                  
                  <Badge className="bg-blue-600 text-white border-blue-600 text-sm font-medium px-4 py-2 ">
                    <Shield className="w-3 h-3 mr-1" />
                    UK Investment Platform
                  </Badge>

                  <h1 className="text-5xl lg:text-6xl font-bold text-white mt-6 mb-6">
                    Earn up to <span className="text-blue-400"> </span> returns investing in UK businesses
                  </h1>

                  <p className="text-xl text-white opacity-90">
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
                      <div className="text-sm text-white opacity-70">Default/Late</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">

                  <Link href="/signup">
                    <Button size="lg" className="text-lg px-8 bg-blue-600    hover:bg-blue-700">
                      Start Investing
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 bg-black bg-opacity-20 text-white border-white border-opacity-30 hover:bg-black hover:bg-opacity-30"
                  >
                    <Play className="mr-2 h-5 w-5" 
                    />
                    Watch How It Works
                  </Button>
                </div>
              </div>

              <div className=" lg:ml-auto ">

                <Card className="bg-white border-0 shadow-2xl max-w-sm ml-auto mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-600">Live</span>
                    </div>

                    <div className="mb-3">

                      <div className="text-3xl font-bold text-gray-900 mb-2"></div>
                      <div className="text-sm text-green-600 font-medium mb-3"></div>
                      <div className="flex  items-center gap-4 text-xs text-gray-500">
                        <span></span>
                        <span>•</span>
                        <span>Monthly income: </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-0 shadow-xl max-w-sm mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex  items-center gap-3 ">
                        <div className="w-10 h-10    bg-green-500 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white " />
                        </div>
                        <div>
                          <h3 className=" font-semibold text-gray-900"></h3>
                          <p className="text-sm text-gray-500"></p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs"></Badge>
                    </div>

                    <div className="mb-4   grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-gray-900"></div>
                        <div className="text-xs text-gray-500">Interest Rate</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900"></div>
                        <div className="text-xs  text-gray-500">Time Period</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-green-600"></div>
                        <div className="text-xs  text-gray-500">Funded</div>
                      </div>
                    </div>

                    <Progress value={0} className="h-2 mb-2" />
                    <div className="text-xs text-gray-500"></div>
                  </CardContent>
                </Card>

                <Card className="max-w-sm bg-white border-0 shadow-xl ml-auto">

                  <CardContent  className="p-6">
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

      <section className="">

      </section>

      <section className="">

      </section>

      <section className="">
        
      </section>



      </section>

      <footer className="border-t py-12 px-4 bg-white">

      </footer>
    </div>
  )
}