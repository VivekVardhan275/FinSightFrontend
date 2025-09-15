// src/app/(app)/groups/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from 'next/link';

// Mock data - replace with API call in a real scenario
const mockGroups = [
  { id: '1', name: 'Trip to Mountains' },
  { id: '2', name: 'Apartment Utilities' },
  { id: '3', name: 'Project Lunch Group' },
];

const pageHeaderBlockMotionVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const contentMotionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15 } },
};

const groupCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};


export default function GroupsPage() {
  // In a real app, you would use a useEffect hook with axios to fetch groups
  // const [groups, setGroups] = React.useState([]);
  // const [isLoading, setIsLoading] = React.useState(true);
  const groups = mockGroups; // Using mock data for now

  return (
    <div className="space-y-8">
      <motion.div
        variants={pageHeaderBlockMotionVariants}
        initial="initial"
        animate="animate"
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Group Expenses
            </h1>
            <p className="text-muted-foreground">
              Manage your shared expenses with groups.
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Group
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={contentMotionVariants}
        initial="initial"
        animate="animate"
        viewport={{ once: true }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            custom={index}
            variants={groupCardVariants}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.03, transition: { duration: 0.2 } }}
          >
            <Card className="shadow-lg transition-shadow hover:shadow-xl h-full flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center">
                  <Users className="mr-3 h-6 w-6 text-primary" />
                  {group.name}
                </CardTitle>
                <CardDescription>
                  View and manage this group's expenses.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Future content can go here, like member count or total expenses */}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/groups/${group.id}`}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
