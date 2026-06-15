import React from 'react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { StarIcon } from 'lucide-react';
import { InferSelectModel } from 'drizzle-orm';
import { products } from '@/db/schema';

type Product = InferSelectModel<typeof products>

export default function ProductCard({ product }: { product: Product }) {
    return (
        <Link href={`/products/${product.id}`}>

            <Card className="group hover:bg-primary-foreground/10 border-gray-400 border-solid min-h-50 card-hover">
                <CardHeader className="flex-1">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="group-hover:text-primary text-lg transition-colors">
                                    {product.name}
                                </CardTitle>


                            </div>
                            <CardDescription>{product.description}</CardDescription>
                        </div>
                        {/** Voting buttons */}

                    </div>
                </CardHeader>
                <CardFooter className='bg-card border-none'>
                    <div className="flex items-center gap-2">
                        {product.tags?.map((tag) => (
                            <Badge variant="secondary" key={tag}>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </CardFooter>
            </Card>

        </Link>
    )
}
