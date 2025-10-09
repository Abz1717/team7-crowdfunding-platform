"use client"

import { useInvestorAdverts } from "@/hooks/useInvestorAdverts"
import LoadingScreen from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

export default function InvestorHomePage() {
  const { data: adverts = [], isLoading: loading, error } = useInvestorAdverts()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (adverts.length === 0 || isHovered) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adverts.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [adverts.length, isHovered])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % adverts.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + adverts.length) % adverts.length)
  }
  return (

  <div className="container mx-auto py-8 px-4 max-w-7.5xl">
      <h1 className="text-2xl font-bold mb-4">Investor Home</h1>
  <p className="mb-8">Invest in the future. Grow with every opportunity.</p>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Featured Opportunities
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {adverts.length === 0 ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">No Promoted Adverts</h2>
                  <p className="text-muted-foreground">Check back soon for investment opportunities</p>
                </div>
              </div>
            ) : (
              <div className="relative h-[85vh] w-full overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                  style={{
                    backgroundImage:
                      adverts[currentSlide]?.imageUrl && adverts[currentSlide]?.imageUrl.length > 0
                        ? `url(${adverts[currentSlide].imageUrl})`
                        : (adverts[currentSlide]?.supporting_media && adverts[currentSlide].supporting_media.length > 0)
                          ? `url(${adverts[currentSlide].supporting_media[0]})`
                          : `url(/placeholder.svg?height=1080&width=1920&query=${encodeURIComponent(adverts[currentSlide]?.title || "investment opportunity")})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                <div
                  className="relative h-full flex flex-col justify-end p-6 md:p-8 lg:p-12"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div
                    className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 justify-center flex items-center ${
                      isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="max-w-4xl mx-auto px-8 text-center">
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">Elevator Pitch</h2>
                      <p className="text-xl md:text-2xl lg:text-3xl text-white/90 leading-relaxed">
                        {adverts[currentSlide]?.elevator_pitch || "Discover the next big opportunity"}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 w-full">
                    <div className="flex items-end justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                            {adverts[currentSlide]?.title}
                          </h2>
                          {adverts[currentSlide]?.isPromoted && (
                            <Badge className="bg-primary text-primary-foreground">Promoted</Badge>
                          )}
                        </div>
                        <div className="mb-4 max-w-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm md:text-base text-white/80 font-medium">Funding</span>
                            <span className="text-sm md:text-base text-white font-semibold">
                              ${adverts[currentSlide]?.current_amount?.toLocaleString?.() ?? adverts[currentSlide]?.current_amount} / ${adverts[currentSlide]?.target_amount?.toLocaleString?.() ?? adverts[currentSlide]?.target_amount}
                            </span>
                          </div>
                          <Progress
                            value={adverts[currentSlide]?.target_amount ? (adverts[currentSlide]?.current_amount / adverts[currentSlide]?.target_amount) * 100 : 0}
                            className="h-3 bg-white/20"
                          />
                        </div>
                        {adverts[currentSlide]?.id && (
                          <Link href={`/investor/browse-pitches/${adverts[currentSlide].id}`}>
                            <Button size="lg" className="bg-white text-black hover:bg-white/90">
                              View Full Pitch
                            </Button>
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={prevSlide}
                          className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div className="text-white font-medium">
                          {currentSlide + 1} / {adverts.length}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={nextSlide}
                          className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 mt-8">
                      {adverts.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

    </div>
  );
}
