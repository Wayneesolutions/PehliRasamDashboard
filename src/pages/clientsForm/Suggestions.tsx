import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button, Avatar, Modal, Pagination } from "antd";
import logo from "../../components/images/logo.png";
import { RightOutlined } from "@ant-design/icons";

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
    const [showOverlay, setShowOverlay] = useState(true);

    const handleOk = () => {
        setShowOverlay(false);
        window.location.href = "https://pehlirasam.exlyapp.com/checkout/34a4a2b0-e647-4037-bc18-59d2a6923531"; // or use useNavigate from react-router-dom
    };

    const handleSkip = () => {
        setShowOverlay(false);
    };

    const paymentBtnRef = useRef<HTMLButtonElement | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (showOverlay && paymentBtnRef.current) {
            const rect = paymentBtnRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + rect.width / 2,
            });
        }
    }, [showOverlay]);


    return (
        <div className="flex flex-col items-center bg-gray-50 min-h-screen p-6 w-full relative">
            {showOverlay && (
                <>
                    {/* Background Blur Overlay */}
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"></div>

                    {/* Tooltip box with arrow */}
                    <div
                        className="absolute z-[9999] bg-black/70 text-white shadow-xl rounded-md px-6 py-4 border border-gray-700 text-center"
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        {/* Tooltip arrow (above box) */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-[9999]">
                            <div className="w-3 h-3 bg-black border-l border-t border-gray-700 rotate-45 shadow-sm"></div>
                        </div>

                        <p className="font-semibold mb-3">Ready to proceed?</p>
                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={handleSkip}
                                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow"
                            >
                                Skip
                            </Button>
                            <Button
                                onClick={handleOk}
                                type="primary"
                                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow"
                            >
                                Ok, Proceed
                            </Button>
                        </div>
                    </div>

                </>
            )}





            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full max-w-6xl mx-auto p-4 gap-4 sm:gap-0 relative">
                    <div className="flex items-center">
                        <img src={logo} alt="Logo" className="w-24 h-12 mr-3" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            Profile Suggestions
                        </h2>
                    </div>

                    {/* Payment button - keep this clickable above overlay */}
                    <div className="flex flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0 relative z-50">
                        <Link to="https://pehlirasam.exlyapp.com/checkout/34a4a2b0-e647-4037-bc18-59d2a6923531" className="z-50">
                            <Button
                                ref={paymentBtnRef}
                                type="primary"
                                size="large"
                                className="px-5 py-2 rounded-md shadow-md w-full sm:w-auto text-center"
                            >
                                Interested? Complete Payment 💍
                            </Button>

                        </Link>
                    </div>

                </div>
            </div>


            {/* Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl pt-32">
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
