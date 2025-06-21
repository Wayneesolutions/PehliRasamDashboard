import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button, Avatar, Modal, Pagination } from "antd";
import logo from "../../components/images/logo.png";
import { RightOutlined } from "@ant-design/icons";

import { ArrowRight, Sparkles } from 'lucide-react';

const suggestionsData = [
    {
        id: 11,
        name: "Benveer",
        gender: "Female",
        height: "5ft 4in",
        country: "L******, Punjab , India",
        education: "Doctorate - PhD",
        job: "Government Job",
        image: "/images/IMG_9831.jpeg",
    },
    {
        id: 12,
        name: "Manpreet",
        gender: "Female",
        height: "5ft 2in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9830.jpeg",
    },
    {
        id: 13,
        name: "Anu",
        gender: "Female",
        height: "5ft 6in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9829.jpeg",
    },
    {
        id: 14,
        name: "Ekjot",
        gender: "Female",
        height: "5ft 1in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9828.jpeg",
    },
    {
        id: 15,
        name: "Manraj",
        gender: "Female",
        height: "5ft 2in",
        country: "J******, Punjab , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9832.jpeg",
    }, {
        id: 16,
        name: "Taranjit",
        gender: "Female",
        height: "5ft 4in",
        country: "L******, Punjab , India",
        education: "Doctorate - PhD",
        job: "Government Job",
        image: "/images/IMG_9825.jpeg",
    },
    {
        id: 17,
        name: "Bhavneet",
        gender: "Female",
        height: "5ft 5in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9824.jpeg",
    },
    {
        id: 18,
        name: "Hargun",
        gender: "Female",
        height: "5ft 6in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9827.jpeg",
    },
    {
        id: 19,
        name: "Jaideep",
        gender: "Female",
        height: "5ft 3in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9823.jpeg",
    },
    {
        id: 20,
        name: "Pawandeep",
        gender: "Female",
        height: "5ft 5in",
        country: "J******, Punjab , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9826.jpeg",
    }, {
        id: 21,
        name: "Rajandeep",
        gender: "Female",
        height: "5ft 4in",
        country: "L******, Haryana , India",
        education: "Doctorate - PhD",
        job: "Private Sector",
        image: "/images/IMG_9822.jpeg",
    },
    {
        id: 22,
        name: "Hans Aishmeena",
        gender: "Female",
        height: "5ft 2in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9817.jpeg",
    },
    {
        id: 23,
        name: "Harsukhman",
        gender: "Female",
        height: "5ft 6in",
        country: "A******, Uttrakhand , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9819.jpeg",
    },
    {
        id: 24,
        name: "Sonia",
        gender: "Female",
        height: "5ft 1in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9821.jpeg",
    },
    {
        id: 25,
        name: "Ritu",
        gender: "Female",
        height: "5ft 2in",
        country: "J******, Punjab , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9818.jpeg",
    }, {
        id: 26,
        name: "Sukhman",
        gender: "Female",
        height: "5ft 4in",
        country: "L******, Jammu , India",
        education: "Doctorate - PhD",
        job: "Government Job",
        image: "/images/IMG_9812.jpeg",
    },
    {
        id: 27,
        name: "Muskaan",
        gender: "Female",
        height: "5ft 2in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9810.jpeg",
    },
    {
        id: 28,
        name: "Gursimran",
        gender: "Female",
        height: "5ft 6in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9809.jpeg",
    },
    {
        id: 29,
        name: "Param",
        gender: "Female",
        height: "5ft 1in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9815.jpeg",
    },
    {
        id: 30,
        name: "Amandeep",
        gender: "Female",
        height: "5ft 2in",
        country: "J******, haryana , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9808.jpeg",
    },
    {
        id: 31,
        name: "Raj",
        gender: "Female",
        height: "5ft 4in",
        country: "J******, Punjab , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9832.jpeg",
    }, {
        id: 32,
        name: "Rohanveer",
        gender: "Male",
        height: "5ft 10in",
        country: "L******, Jammu , India",
        education: "Doctorate - PhD",
        job: "Businessman",
        image: "/images/IMG_9862.jpeg",
    },
    {
        id: 33,
        name: "Jovan",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9834.jpeg",
    },
    {
        id: 34,
        name: "Ishaan",
        gender: "Male",
        height: "6ft 1in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9837.jpeg",
    },
    {
        id: 35,
        name: "Aaron",
        gender: "Male",
        height: "5ft 11in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9853.jpeg",
    },
    {
        id: 36,
        name: "Arjan",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, haryana , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9856.jpeg",
    }, {
        id: 37,
        name: "Taranjit",
        gender: "Male",
        height: "5ft 10in",
        country: "L******, Jammu , India",
        education: "Doctorate - PhD",
        job: "Businessman",
        image: "/images/IMG_9851.jpeg",
    },
    {
        id: 38,
        name: "Jeetender",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9850.jpeg",
    },
    {
        id: 39,
        name: "Randeer",
        gender: "Male",
        height: "6ft 1in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9852.jpeg",
    },
    {
        id: 40,
        name: "Pardeep",
        gender: "Male",
        height: "5ft 11in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9840.jpeg",
    },
    {
        id: 41,
        name: "Sukhman",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, haryana , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9841.jpeg",
    }, {
        id: 42,
        name: "Vijender",
        gender: "Male",
        height: "5ft 10in",
        country: "L******, Jammu , India",
        education: "Doctorate - PhD",
        job: "Businessman",
        image: "/images/IMG_9849.jpeg",
    },
    {
        id: 43,
        name: "Sumann",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9844.jpeg",
    },
    {
        id: 44,
        name: "Gagandeep",
        gender: "Male",
        height: "6ft 1in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9845.jpeg",
    },
    {
        id: 45,
        name: "Prince",
        gender: "Male",
        height: "5ft 11in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Government Job",
        image: "/images/IMG_9848.jpeg",
    },
    {
        id: 46,
        name: "Pardeep",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, haryana , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9843.jpeg",
    }, {
        id: 47,
        name: "Amandeep",
        gender: "Male",
        height: "5ft 10in",
        country: "L******, Jammu , India",
        education: "Doctorate - PhD",
        job: "Businessman",
        image: "/images/IMG_9838.jpeg",
    },
    {
        id: 48,
        name: "Himanshujeet",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9833.jpeg",
    },
    {
        id: 49,
        name: "Sukhchran",
        gender: "Male",
        height: "6ft 1in",
        country: "A******, Punjab , India",
        education: "Graduation",
        job: "Self-Employed",
        image: "/images/IMG_9861.jpeg",
    },
    {
        id: 50,
        name: "Navu",
        gender: "Male",
        height: "5ft 11in",
        country: "P****, Maharasthra , India",
        education: "Ph.D",
        job: "Businessman",
        image: "/images/IMG_9860.jpeg",
    },
    {
        id: 51,
        name: "Roshan",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, haryana , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9859.jpeg",
    }, {
        id: 52,
        name: "Surjit",
        gender: "Male",
        height: "5ft 9in",
        country: "J******, Rajasthan , India",
        education: "Post Graduation",
        job: "Freelancer",
        image: "/images/IMG_9850.jpeg",
    }
];

const Suggestions = () => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        window.open('https://pehlirasam.exlyapp.com/checkout/34a4a2b0-e647-4037-bc18-59d2a6923531', '_blank');
    };
    const navigate = useNavigate();
    const [visibleCount, setVisibleCount] = useState(9);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [gender, setGender] = useState<string | null>(null);

    useEffect(() => {
        const isRegistered = localStorage.getItem("isRegistered");
        const registeredGender = localStorage.getItem("gender");

        if (!isRegistered) {
            navigate("/submissionform");
            return;
        }

        if (registeredGender?.toLowerCase() === "female") {
            setGender("male");
        } else if (registeredGender?.toLowerCase() === "male") {
            setGender("female");
        } else {
            setGender(null);
        }
    }, [navigate]);

    const filteredSuggestions = gender
        ? suggestionsData.filter((person) => person.gender.toLowerCase() === gender)
        : [];


    const loadMore = () => {
        setVisibleCount((prevCount) => Math.min(prevCount + 12, filteredSuggestions.length));
    };
    const handlePageChange = (page: number) => {
        if (page !== 1) {
            window.location.href = "https://pehlirasam.exlyapp.com/checkout/34a4a2b0-e647-4037-bc18-59d2a6923531";
        }
    };




    return (
        <div className="flex flex-col items-center bg-gray-50 min-h-screen p-6 w-full relative">

            <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
                <div className="w-full max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6">

                    {/* Left: Logo + Title */}
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="w-24 h-12 object-contain" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            Profile Suggestions
                        </h2>
                    </div>

                    {/* Right: Next + Animated Arrow + Button */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-6 sm:ml-auto">

                        {/* NEXT + Arrow Circle tightly together */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Text: Next */}
                            <div className="relative">
                                <span className="text-gray-800 font-bold text-lg sm:text-xl transition-all duration-500 hover:text-blue-600">
                                    Next
                                </span>
                                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 hover:w-full"></div>
                                <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-blue-400 animate-pulse opacity-60" />
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="relative group w-16 h-16 flex items-center justify-center">
                                    {/* Outer Glow */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-60 blur-lg animate-pulse group-hover:animate-spin"></div>

                                    {/* White Circle with Fixed Size */}
                                    <div className="relative w-full h-full rounded-full bg-white border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
                                        {/* Arrow with consistent animation across all devices */}
                                        <div className="arrow-animated relative z-10 font-bold text-3xl">
                                            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent filter drop-shadow-sm">
                                                <span className="text-4xl font-bold">➜</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={handleClick}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="group relative px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 !text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 sm:hover:-translate-y-1 sm:hover:scale-105 flex items-center gap-3"
                        >
                            {/* Gradient glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"></div>

                            {/* Shimmer */}
                            <div className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                <span>Complete Payment</span>
                                <ArrowRight className={`w-5 h-5 transition-all duration-500 ${isHovered ? 'translate-x-2 rotate-12 scale-110' : ''}`} />
                            </div>

                            {/* 💳 - fix alignment for mobile too */}
                            <div className="absolute top-1/2 right-2 -translate-y-1/2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-12 group-hover:rotate-45 transition-transform duration-500">
                                <span className="text-xs">💳</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(40px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(40px) rotate(-360deg);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes slide-x {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(8px);
          }
        }
        
        .animate-slide-x {
          animation: slide-x 2s ease-in-out infinite;
        }
        
        @keyframes slideLeftRight {
          0%, 100% {
            transform: translateX(-4px) scale(1);
          }
          50% {
            transform: translateX(4px) scale(1.1);
          }
        }
        
        @keyframes glow {
          0% {
            filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.5));
          }
          100% {
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 12px rgba(147, 51, 234, 0.6));
          }
        }
        
        /* Apply consistent animation to arrow on ALL devices */
        .arrow-animated {
          animation: slideLeftRight 2s ease-in-out infinite, glow 1.5s ease-in-out infinite alternate;
        }
        
        /* Ensure mobile and desktop use the same animation */
        @media (max-width: 639px) {
          .arrow-animated {
            animation: slideLeftRight 2s ease-in-out infinite, glow 1.5s ease-in-out infinite alternate;
          }
        }
        
        @media (min-width: 640px) {
          .arrow-animated {
            animation: slideLeftRight 2s ease-in-out infinite, glow 1.5s ease-in-out infinite alternate;
          }
        }
      `}</style>



            {/* Profile Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pt-45 md:pt-28">

                {filteredSuggestions.slice(0, visibleCount).map((person) => (
                    <Card
                        key={person.id}
                        className="w-full max-w-lg shadow-md rounded-lg border border-gray-200 bg-white hover:shadow-lg transition-all"
                        bodyStyle={{ padding: 0 }}
                    >
                        <div className="flex items-center p-4 pr-10">
                            <Avatar
                                size={100}
                                src={person.image}
                                className="border border-gray-300 shadow-sm rounded-full cursor-pointer transition-transform duration-300 ease-in-out hover:scale-110"
                                onClick={() => setSelectedImage(person.image)}
                            />
                            <div className="flex flex-col space-y-1 pl-5 pr-8 w-full">
                                <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                                <p className="text-gray-600 text-xs">
                                    👤 {person.gender} | {person.height}
                                </p>
                                <p className="text-gray-500 text-xs">🎓 {person.education}</p>
                                <p className="text-gray-700 text-sm font-medium">💼 {person.job}</p>
                                <p className="text-gray-500 text-xs">📍 {person.country}</p>
                                <Link to="https://pehlirasam.exlyapp.com/checkout/34a4a2b0-e647-4037-bc18-59d2a6923531">
                                    <Button className="mt-3 px-5 py-2 rounded-md shadow-md text-xs font-medium">
                                        Unlock
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Load More */}
            {visibleCount < filteredSuggestions.length && (
                <div className="mt-6">
                    <Button
                        type="primary"
                        size="large"
                        onClick={loadMore}
                        className="px-5 py-2 rounded-md shadow-md hover:shadow-lg transition-all"
                    >
                        Load More
                    </Button>
                </div>
            )}

            {/* Pagination */}
            <div className="mt-6">
                <Pagination
                    current={1}
                    total={10}
                    pageSize={10}
                    showSizeChanger={false}
                    onChange={handlePageChange}
                    itemRender={(page, type, originalElement) => {
                        if (type === "page") {
                            return page === 1 ? originalElement : null;
                        }
                        if (type === "prev") return null;
                        if (type === "next") {
                            return (
                                <a
                                    href="https://pehlirasam.exlyapp.com/checkout/34a4a2b0-e647-4037-bc18-59d2a6923531"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                                >
                                    Next <RightOutlined />
                                </a>
                            );
                        }
                        return originalElement;
                    }}
                />
            </div>

            {/* Full Image Modal */}
            <Modal
                open={!!selectedImage}
                footer={null}
                centered
                onCancel={() => setSelectedImage(null)}
                className="flex items-center justify-center"
            >
                {selectedImage && (
                    <img src={selectedImage} alt="Profile" className="w-full h-auto rounded-lg" />
                )}
            </Modal>



        </div>
    );
};

export default Suggestions;
