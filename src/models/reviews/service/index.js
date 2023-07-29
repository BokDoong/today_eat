import {UserService} from "../../users/service";
import {storeService} from "../../stores/service";
import database from "../../../database";

class ReviewService{
    userService;
    storeService;
    constructor(){
        this.userService = new UserService();
    }

    //리뷰 작성
    createReview = async (props) => {
        const user = await this.userService.findUserById(props.userId);
        const store = await storeService.findStoreByID(props.storeId);
        const newReview = await database.review.create({
            data:{
                content:props.content,
                score:props.score,
                user:{
                    connect:{
                        id:user.id,
                    }
                },
                store:{
                    connect:{
                        id:store.id,
                    },
                },
                keywords:{
                    createMany:{
                        data:props.keywords.map((keyword)=>({
                            name:keyword,
                            storeId:store.id,
                        })),
                    }
                },
                tags:{
                    createMany:{
                        data:props.tags.map((tag)=>({
                            name:tag,
                            storeId:store.id,
                        })),
                    }
                },
                reviewImages:{
                    createMany:{
                        data:props.images.map((image)=>({imageUrl:image}))
                    }
                }
            }
        })

        return newReview.id;
    }

    //리뷰 수정
    updateReview = async (reviewId, props) => {
        const user = await this.userService.findUserById(props.userId);
        const store = await storeService.findStoreByID(props.storeId);
        await database.reviewImage.deleteMany({
            where:{
                reviewId:reviewId,
            }
        });
        const newReview = await database.review.update({
            where:{
                id:reviewId,
            },
            data:{
                content:props.content,
                score:props.score,
                user:{
                    connect:{
                        id:user.id,
                    }
                },
                store:{
                    connect:{
                        id:store.id,
                    },
                },
                keywords:{
                    createMany:{
                        data:props.keywords.map((keyword)=>({
                            name:keyword,
                            storeId:store.id,
                        })),
                    }
                },
                tags:{
                    createMany:{
                        data:props.tags.map((tag)=>({
                            name:tag,
                            storeId:store.id,
                        })),
                    }
                },
                reviewImages:{
                    createMany:{
                        data:props.images.map((image)=>({imageUrl:image}))
                    }
                }
            }
        })

        return newReview.id;
    }

    //리뷰 삭제
    async deleteReview(reviewId){
        const review = await database.review.findUnique({
            where:{
                id:reviewId,
            }
        });
        if(!review)throw{status:404,messaga:"리뷰를 찾을 수 없습니다."};

        await database.review.delete({
            where:{
                id:review.id
            },
            include:{
                reviewImages:true,
                reviewLikes:true,
            }
        })
        
    }

    //리뷰 좋아요
    async reviewLike(userId,reviewId,isLike){
        if(isLike){
            await database.reviewLike.create({
                data:{
                    review:{
                        connect:{
                            id:reviewId,
                        },
                    },
                    user:{
                        connect:{
                            id:userId,
                        },
                    },
                }
            })
        }else{
            await database.reviewLike.delete({
                where:{
                    userId_reviewId:{
                        userId:userId,
                        reviewId,reviewId,
                    }
                }
            })
        }
    }

    async findReviewSample(storeId){
        const data = await database.review.findFirst({
            include:{
                reviewImages:true,
            },
            where:{
                storeId:storeId,
            },
        });
        if(!data){
            return;
        }
        return data;
    }

    async findReviewImages(storeId){
        const data = await database.review.findMany({
            where:{
                storeId:storeId,
            }
        });
        const reviews = data.map((review)=>{
            return review.id;
        })
        let images = await database.reviewImage.findMany({
            select:{
                imageUrl:true,
            },
            where:{
                reviewId:{
                    in:[...reviews],
                }
            },
            take:4,
        })
        images = images.map((image)=>{
            return image.imageUrl;
        })
        const count = await database.reviewImage.aggregate({
            where:{
                reviewId:{
                    in:[...reviews],
                }
            },
            _count:{
                _all:true,
            }
        })

        return {imageURLs:images,imageCount:count._count._all};
    }

    async getReviewCount(storeId){
        const data = await database.review.aggregate({
            where:{
                storeId:storeId,
            },
            _count:{
                _all:true,
            }
        })
        return data._count._all;
    }

    async findReviewByUser(userId){
        const reviews = await database.review.findMany({
            where:{
                userId:userId,
            },
            orderBy:{
                createdAt:"asc"
            }
        });

        return reviews;
    }
}

export const reviewService = new ReviewService();