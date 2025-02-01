--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tasks" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(255) DEFAULT 'pending'::character varying,
    deadline date,
    intern_id integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Tasks" OWNER TO postgres;

--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Tasks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Tasks_id_seq" OWNER TO postgres;

--
-- Name: Tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Tasks_id_seq" OWNED BY public."Tasks".id;


--
-- Name: company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_approved boolean DEFAULT false,
    address character varying(255) NOT NULL,
    contact character varying(255) NOT NULL,
    department character varying(100),
    role character varying(100),
    description text,
    sendbird_id character varying(255)
);


ALTER TABLE public.company OWNER TO postgres;

--
-- Name: company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_id_seq OWNER TO postgres;

--
-- Name: company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_id_seq OWNED BY public.company.id;


--
-- Name: company_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_requests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    contact character varying(20) NOT NULL,
    address character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.company_requests OWNER TO postgres;

--
-- Name: company_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_requests_id_seq OWNER TO postgres;

--
-- Name: company_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_requests_id_seq OWNED BY public.company_requests.id;


--
-- Name: companyinternshiprequests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companyinternshiprequests (
    id integer NOT NULL,
    company_id integer,
    intern_id integer,
    application_status character varying(20) DEFAULT 'Pending'::character varying,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    decision_at timestamp without time zone
);


ALTER TABLE public.companyinternshiprequests OWNER TO postgres;

--
-- Name: companyinternshiprequests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companyinternshiprequests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companyinternshiprequests_id_seq OWNER TO postgres;

--
-- Name: companyinternshiprequests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companyinternshiprequests_id_seq OWNED BY public.companyinternshiprequests.id;


--
-- Name: intern; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intern (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    school_id character varying(10) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_approved boolean DEFAULT false,
    address character varying(255) NOT NULL,
    department character varying(100),
    university character varying(100),
    uid uuid DEFAULT gen_random_uuid(),
    profile_picture character varying(255),
    sendbird_id character varying(255)
);


ALTER TABLE public.intern OWNER TO postgres;

--
-- Name: intern_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.intern_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.intern_id_seq OWNER TO postgres;

--
-- Name: intern_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.intern_id_seq OWNED BY public.intern.id;


--
-- Name: intern_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intern_requests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    school_id character varying(6) NOT NULL,
    address character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT intern_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.intern_requests OWNER TO postgres;

--
-- Name: intern_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.intern_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.intern_requests_id_seq OWNER TO postgres;

--
-- Name: intern_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.intern_requests_id_seq OWNED BY public.intern_requests.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    content text NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    username character varying(50),
    school_id integer,
    company_id integer
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: school; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_approved boolean DEFAULT false,
    address character varying(255),
    description text,
    contact character varying(20)
);


ALTER TABLE public.school OWNER TO postgres;

--
-- Name: school_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.school_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_id_seq OWNER TO postgres;

--
-- Name: school_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.school_id_seq OWNED BY public.school.id;


--
-- Name: school_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.school_requests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    address character varying(255),
    CONSTRAINT school_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.school_requests OWNER TO postgres;

--
-- Name: school_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.school_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.school_requests_id_seq OWNER TO postgres;

--
-- Name: school_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.school_requests_id_seq OWNED BY public.school_requests.id;


--
-- Name: sendbird_user_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sendbird_user_data (
    id integer NOT NULL,
    user_id integer NOT NULL,
    sendbird_id character varying(255) NOT NULL,
    nickname character varying(255),
    profile_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sendbird_user_data OWNER TO postgres;

--
-- Name: sendbird_user_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sendbird_user_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sendbird_user_data_id_seq OWNER TO postgres;

--
-- Name: sendbird_user_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sendbird_user_data_id_seq OWNED BY public.sendbird_user_data.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deadline date,
    intern_id integer
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: uploaded_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uploaded_files (
    id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    intern_id integer NOT NULL,
    company_id integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.uploaded_files OWNER TO postgres;

--
-- Name: uploaded_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uploaded_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uploaded_files_id_seq OWNER TO postgres;

--
-- Name: uploaded_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uploaded_files_id_seq OWNED BY public.uploaded_files.id;


--
-- Name: Tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tasks" ALTER COLUMN id SET DEFAULT nextval('public."Tasks_id_seq"'::regclass);


--
-- Name: company id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company ALTER COLUMN id SET DEFAULT nextval('public.company_id_seq'::regclass);


--
-- Name: company_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_requests ALTER COLUMN id SET DEFAULT nextval('public.company_requests_id_seq'::regclass);


--
-- Name: companyinternshiprequests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companyinternshiprequests ALTER COLUMN id SET DEFAULT nextval('public.companyinternshiprequests_id_seq'::regclass);


--
-- Name: intern id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern ALTER COLUMN id SET DEFAULT nextval('public.intern_id_seq'::regclass);


--
-- Name: intern_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_requests ALTER COLUMN id SET DEFAULT nextval('public.intern_requests_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: school id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school ALTER COLUMN id SET DEFAULT nextval('public.school_id_seq'::regclass);


--
-- Name: school_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_requests ALTER COLUMN id SET DEFAULT nextval('public.school_requests_id_seq'::regclass);


--
-- Name: sendbird_user_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sendbird_user_data ALTER COLUMN id SET DEFAULT nextval('public.sendbird_user_data_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: uploaded_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploaded_files ALTER COLUMN id SET DEFAULT nextval('public.uploaded_files_id_seq'::regclass);


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tasks" (id, title, description, status, deadline, intern_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company (id, name, email, password, created_at, is_approved, address, contact, department, role, description, sendbird_id) FROM stdin;
2	Naruto	companysda@gmail.com	$2b$10$9lAGIrcGvH5ONya9Ct9eGO0NZ1AXLKzfWRiZmYWrchK6eQ80L7M9q	2024-10-15 01:33:21.060766	t	Jiabong	09059556354	\N	\N	\N	\N
3	Samelco II	companytest@email.com	$2b$10$q8zUQyeJi6udixxtzS9JpuxGmArGcLeMNjSkOyAzHXMBFwFL0TmG6	2024-10-31 00:15:17.548517	t	Maharlika Highway, Brgy. 6 Poblacion, Paranas, Samar	09059556666	Industrial Technology	Electrician	SAMELCO II is a non-stock, non-profit electric service provider serving the Second District of Samar.	\N
1	GapLabs 	company@email.com	$2b$10$3uHSbIEmSeP8Uv..tVfe3Oi/FNZoOYjihS6uX0rf7iaiI5MIqmUVa	2024-10-15 01:16:55.309727	t	Catbalogan City	09059556354	Information Technology	Programmer	GAPLabs, Inc. \nGroups, Algorithms and Programming Laboratories	\N
5	New Company 	companyNEW@email.com	$2b$10$1Hk1OLjf067tKMIbV/RKXOB/VRra9JFuohqjl1WaM./IcMyjc3cf.	2024-12-06 23:31:35.29263	t	Tacloban City	09058664535	\N	\N	\N	\N
\.


--
-- Data for Name: company_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_requests (id, name, email, contact, address, password, status, created_at) FROM stdin;
1	Company	company@gmail.com	09059556354	Jiabong Samar	$2b$10$qNJKkTpexYuRQ6pLdDTvsO2On225hb.ZpOg4AZHNPdUgnQN2j.t.a	approved	2024-10-12 21:26:15.084793
2	Company2	company2@email.com	09663620401	Catbalogan City	$2b$10$WGF8ggwgBcOO.zkBWbF/eOjNpi1V28FVyKpeLSBafvhzHgMLPvh86	approved	2024-10-12 22:45:43.448254
11	company	company12@email.com	09059556666	jiabong	$2b$10$2xR2E0QgugjxmCwLKxicCe573HTUfMglEu11Ad2NOjq4e4yaNMEua	approved	2024-10-14 23:58:51.17082
13	Company New	new@gmail.com	09059556354	Jiabong Samar	$2b$10$QE0p4oyT6iuKJX.gCx1CmehrBG9B7IZrsXSF1fBMxk5TssYOLRk9K	approved	2024-10-15 00:04:33.422554
14	Samelco	companyreal@gmail.com	09059556354	Catbalogan City	$2b$10$3uHSbIEmSeP8Uv..tVfe3Oi/FNZoOYjihS6uX0rf7iaiI5MIqmUVa	approved	2024-10-15 01:16:46.602007
15	Naruto	companysda@gmail.com	09059556354	Jiabong	$2b$10$9lAGIrcGvH5ONya9Ct9eGO0NZ1AXLKzfWRiZmYWrchK6eQ80L7M9q	approved	2024-10-15 01:33:15.005632
16	Company	companytest@email.com	09059556666	Jiabong	$2b$10$q8zUQyeJi6udixxtzS9JpuxGmArGcLeMNjSkOyAzHXMBFwFL0TmG6	approved	2024-10-15 21:29:18.688668
17	Company	companytest1@email.com	09059556666	Jiabong	$2b$10$dQvzxZTgWXBXODju08BVHefCdH2Douv.0WS1ejhL76xRAPWKV50LO	approved	2024-10-15 21:31:26.758853
18	New Company 	companyNEW@email.com	09058664535	Tacloban City	$2b$10$1Hk1OLjf067tKMIbV/RKXOB/VRra9JFuohqjl1WaM./IcMyjc3cf.	approved	2024-12-06 23:31:27.443415
\.


--
-- Data for Name: companyinternshiprequests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companyinternshiprequests (id, company_id, intern_id, application_status, applied_at, decision_at) FROM stdin;
\.


--
-- Data for Name: intern; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.intern (id, name, email, school_id, password, created_at, is_approved, address, department, university, uid, profile_picture, sendbird_id) FROM stdin;
2	Junel Abonales	intern2@email.com	111111	$2b$10$1A/OacltmiiAjKH./zAIa.FRlWxxnM.BMrl7QuCTDwak.9gM8ZRai	2024-10-31 03:29:13.256179	t	Jiabong Samar 	\N	\N	fe29a1cd-f41c-44b6-bca7-2781cad45db2	\N	\N
3	Dexter Ellano	intern3@email.com	222222	$2b$10$UnrAclfZjHZ8vsfSYTt2ue6RFgyn5lILhqOcP8.46JfjjLU1Oj.fu	2024-11-12 22:06:27.8734	t	Catbalogan City	\N	\N	f0f38d6c-7f71-4cdf-97af-de51cf5a85f0	\N	\N
1	Mushiyo P. Abonales 	intern@email.com	211673	$2b$10$NC1SxgG.ekFXaW1iJwMItO4WzJmtrFY4PWTyg.lD6RjsQ3BfWcKrC	2024-10-31 03:28:01.350243	t	Imelda Ave Brgy Alejandrea, Jiabong Samar	Information Technology	Samar State University	4198834d-6b2f-4afa-b8c5-319550efc10b	\N	\N
\.


--
-- Data for Name: intern_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.intern_requests (id, name, email, school_id, address, password, status, created_at) FROM stdin;
1	Intern Kun	intern@email.com	211673	Jiabong	$2b$10$NC1SxgG.ekFXaW1iJwMItO4WzJmtrFY4PWTyg.lD6RjsQ3BfWcKrC	approved	2024-10-19 23:09:48.321702
2	Junel Abonales	intern2@email.com	111111	Jiabong Samar 	$2b$10$1A/OacltmiiAjKH./zAIa.FRlWxxnM.BMrl7QuCTDwak.9gM8ZRai	approved	2024-10-31 03:27:38.955677
3	Dexter Ellano	intern3@email.com	222222	Catbalogan City	$2b$10$UnrAclfZjHZ8vsfSYTt2ue6RFgyn5lILhqOcP8.46JfjjLU1Oj.fu	approved	2024-10-31 03:31:37.248452
4	Jemart Jabien	internNEW@email.com	999999	Jiabong Samar 	$2b$10$5Km7bvclmaOMin9ZZEntOukwfy6CGyafdwOEXjJbZOZAfkUPhn0Iy	pending	2024-12-06 23:27:20.680437
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, content, image_url, created_at, username, school_id, company_id) FROM stdin;
112	December 1 2024 Company Test Post	\N	2024-12-01 00:19:02.052145	\N	\N	1
113	Test	\N	2024-12-05 11:57:59.459496	\N	4	\N
105	asd	\N	2024-11-30 23:57:14.704566	\N	4	\N
\.


--
-- Data for Name: school; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school (id, name, email, password, created_at, is_approved, address, description, contact) FROM stdin;
4	Samar State University    	SSU@email.com	$2b$10$eJzdbFlbmFubj8hDbKTdXuiDOJu.4Y79tXhX9nbRVjLkkEOFnVlUS	2024-11-09 19:47:26.357153	t	Catbalogan City 	Samar State University is an educational landmark of vital importance to the province of Samar.	09059556666
5	SSU	SSUtest@email.com	$2b$10$HqD4q3elc1XWHOZox77RUuyPTJdBxRc61ybn7nef2O7ZE6WGZe.km	2024-12-05 11:56:33.022466	t	Catbalogan CIty	\N	\N
6	JNSSU	ssutesttest@email.com	$2b$10$MszESCx2MW9HuEEQJdQdJu4UElVjUKKzo9Slpo.7j3YjNSqefLm1W	2024-12-06 23:33:42.51034	t	Catbalogan Samar	\N	\N
\.


--
-- Data for Name: school_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.school_requests (id, name, email, password, status, created_at, address) FROM stdin;
31	ssu	SSU2@gmail.com	$2b$10$BdviHKzXSj3HpaZedxoRpeFsf7aQg6v1PfVvianK1rNrf6tlWOhI2	approved	2024-10-15 00:46:12.792084	jiabong
1	Samar State University	lenujpagliawan@gmail.com	$2b$10$QSRsdCu51OjZoOq/d.mk2O1r0HnmXNaFmrOGH6ud1f5gmZFouhHn6	approved	2024-09-25 22:10:54.76654	\N
33	ssu	SSU4@gmail.com	$2b$10$lgUMqxOfgZt/LnUMND0ine4NuVlTIQLI6pG7tnXQ/LnQz4HFhpduG	approved	2024-10-15 00:53:13.093665	jiabong
32	ssu	SSU3@gmail.com	$2b$10$WDuuZKLcWg44pgEWRmEXYOgD8s3y6vdp/CEDNgtELTS0vhfniLGuy	rejected	2024-10-15 00:53:09.358831	jiabong
35	ssu	SSU6@gmail.com	$2b$10$JluDiwhHR/o8/ZAVM6smieV/iKiY.aVfYAE6C3MnqhsqCvomXKIs.	approved	2024-10-15 01:09:09.068469	jiabong
22	JNHS3	jnhs12@gmail.com	$2b$10$bh7/RmEjU0dGMhib9XVHUOryTqs6.xid0ePUddX4I.t89ANptDFaG	rejected	2024-10-13 21:20:22.711656	Jiabong
34	ssu	SSU5@gmail.com	$2b$10$i87q/63BCWJpOEw74cQLJe2Y9QNYrjchRNw1dxxJqoR/cY.Yx4P8m	approved	2024-10-15 00:59:04.425851	jiabong
18	JNHS3	jnhs8@gmail.com	$2b$10$BNLezccJr/Ejrs32C0efd.Vkf8tH31Yh74/kwxJcuUIPNeihXjGT.	rejected	2024-10-13 21:15:52.132885	Jiabong
10	SSU	test1@gmail.com	$2b$10$fJ1hU0GoLfsD3VQSjc8LE.xeJnLekybBsBFW.6HQjcTm6yQ3uuBzq	rejected	2024-10-05 20:05:22.922904	Catbalogan City
19	JNHS3	jnhs9@gmail.com	$2b$10$SA4v.JWGMILFRI8OjjNjZOUFcFXBmdk3MzNaOr5oTaknblHq2Brim	rejected	2024-10-13 21:17:19.370922	Jiabong
23	JNHS3	jnhs13@gmail.com	$2b$10$fpNsEw.yb0z628t6mj0U1edBVQecK5Gst6GlfTzrhz.mpL24l4f52	rejected	2024-10-13 21:26:08.321574	Jiabong
36	jnhs	jnhs1@gmail.com	$2b$10$2TxDj57FWUXnoc1FLdBMUOJiTmnLb/sK2IcfA0gFXQeS8lhOO4/8e	approved	2024-10-15 01:18:47.144435	jiabong
37	jnhs	jnhs5@gmail.com	$2b$10$5E2KAk9.oZdZM.ssxH/MguDgMXjzvNTvQv2WfCJQcLMCujjzYZYnu	approved	2024-10-15 01:32:59.129639	jiabong
38	jces	jces@gmail.com	$2b$10$DNoxE9/n0.mxwK3f0kajA.E1dQZDuonHvAspfZo1mILtVyT0018SS	approved	2024-10-15 19:10:56.045105	jiabong
40	Samar State University	wkindacara@gmail.com	$2b$10$7cA2WOCdpajuWq9y2sqTcuy/AgzCMYB//DmI.l3GUtIT2PzHA3VCC	approved	2024-10-22 16:11:09.518998	Brgy. Bunu-anan Catbalogan City Samar
39	School1	school@email.com	$2b$10$0UHkwEjRpHcOkQp6UHhcFuyLTiBlZZr..K4KgqaT1Xa51KiiBR7Xm	approved	2024-10-15 21:28:59.839347	Jiabong
20	JNHS3	jnhs10@gmail.com	$2b$10$NIcY3Kx0rXUaO11qx58PTuMFJXgTkO9..MMNPz4k/P2VFHps36EPC	rejected	2024-10-13 21:17:24.251706	Jiabong
26	JNHS3	jnhs16@gmail.com	$2b$10$skJezlpVsw5G1oQxJFQ9VeivovKlrWcmgNYxPDmJMyRcRuR3HtYj6	rejected	2024-10-13 22:06:21.053258	Jiabong
43	SSU	ssutest@email.com	$2b$10$ikF0eHMFdXgxEjVYgorcjeGYPJknoHu3s7edQkfmJrlOSdasDRW5W	approved	2024-11-09 17:19:09.104152	Jiabong
44	SSU	ssu4@email.com	$2b$10$UtpMYVNliSXS5ToxrLm08OoKg.uFUY1LsTw6KLK80TCpWVL2Q6BtW	approved	2024-11-09 17:19:14.778603	Jiabong
41	SSU	ssu3@email.com	$2b$10$qqiIOTwXImKsUQKpB6LO6OZog0mblDH1CDXJPrOFEMYXFkd5sufH2	rejected	2024-11-09 17:18:53.073411	Jiabong
45	Samar State University	SSU@email.com	$2b$10$eJzdbFlbmFubj8hDbKTdXuiDOJu.4Y79tXhX9nbRVjLkkEOFnVlUS	approved	2024-11-09 19:47:17.092635	Catbalogan City 
46	SSU	SSUtest@email.com	$2b$10$HqD4q3elc1XWHOZox77RUuyPTJdBxRc61ybn7nef2O7ZE6WGZe.km	approved	2024-12-05 11:56:10.128549	Catbalogan CIty
47	JNSSU	ssutesttest@email.com	$2b$10$MszESCx2MW9HuEEQJdQdJu4UElVjUKKzo9Slpo.7j3YjNSqefLm1W	approved	2024-12-06 23:25:22.338333	Catbalogan Samar
\.


--
-- Data for Name: sendbird_user_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sendbird_user_data (id, user_id, sendbird_id, nickname, profile_url, created_at, updated_at) FROM stdin;
1	2	2	Junel Abonales		2024-12-04 23:54:28.077971	2024-12-04 23:54:28.077971
2	3	3	Dexter Ellano		2024-12-04 23:59:02.826226	2024-12-04 23:59:02.826226
3	1	1	Mushiyo P. Abonales 		2024-12-05 00:04:52.101523	2024-12-05 00:04:52.101523
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, status, created_at, updated_at, deadline, intern_id) FROM stdin;
\.


--
-- Data for Name: uploaded_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uploaded_files (id, file_name, original_name, intern_id, company_id, uploaded_at) FROM stdin;
\.


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Tasks_id_seq"', 6, true);


--
-- Name: company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_id_seq', 5, true);


--
-- Name: company_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_requests_id_seq', 18, true);


--
-- Name: companyinternshiprequests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companyinternshiprequests_id_seq', 15, true);


--
-- Name: intern_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intern_id_seq', 3, true);


--
-- Name: intern_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intern_requests_id_seq', 4, true);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 113, true);


--
-- Name: school_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.school_id_seq', 6, true);


--
-- Name: school_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.school_requests_id_seq', 47, true);


--
-- Name: sendbird_user_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sendbird_user_data_id_seq', 3, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: uploaded_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uploaded_files_id_seq', 4, true);


--
-- Name: Tasks Tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: company company_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_email_key UNIQUE (email);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: company_requests company_requests_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_requests
    ADD CONSTRAINT company_requests_email_key UNIQUE (email);


--
-- Name: company_requests company_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_requests
    ADD CONSTRAINT company_requests_pkey PRIMARY KEY (id);


--
-- Name: companyinternshiprequests companyinternshiprequests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companyinternshiprequests
    ADD CONSTRAINT companyinternshiprequests_pkey PRIMARY KEY (id);


--
-- Name: intern intern_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern
    ADD CONSTRAINT intern_email_key UNIQUE (email);


--
-- Name: intern intern_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern
    ADD CONSTRAINT intern_pkey PRIMARY KEY (id);


--
-- Name: intern_requests intern_requests_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_requests
    ADD CONSTRAINT intern_requests_email_key UNIQUE (email);


--
-- Name: intern_requests intern_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_requests
    ADD CONSTRAINT intern_requests_pkey PRIMARY KEY (id);


--
-- Name: intern_requests intern_requests_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern_requests
    ADD CONSTRAINT intern_requests_school_id_key UNIQUE (school_id);


--
-- Name: intern intern_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern
    ADD CONSTRAINT intern_school_id_key UNIQUE (school_id);


--
-- Name: intern intern_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intern
    ADD CONSTRAINT intern_uid_key UNIQUE (uid);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: school school_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school
    ADD CONSTRAINT school_email_key UNIQUE (email);


--
-- Name: school school_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school
    ADD CONSTRAINT school_pkey PRIMARY KEY (id);


--
-- Name: school_requests school_requests_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_requests
    ADD CONSTRAINT school_requests_email_key UNIQUE (email);


--
-- Name: school_requests school_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.school_requests
    ADD CONSTRAINT school_requests_pkey PRIMARY KEY (id);


--
-- Name: sendbird_user_data sendbird_user_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sendbird_user_data
    ADD CONSTRAINT sendbird_user_data_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: uploaded_files uploaded_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_pkey PRIMARY KEY (id);


--
-- Name: companyinternshiprequests companyinternshiprequests_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companyinternshiprequests
    ADD CONSTRAINT companyinternshiprequests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON DELETE CASCADE;


--
-- Name: companyinternshiprequests companyinternshiprequests_intern_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companyinternshiprequests
    ADD CONSTRAINT companyinternshiprequests_intern_id_fkey FOREIGN KEY (intern_id) REFERENCES public.intern(id) ON DELETE CASCADE;


--
-- Name: sendbird_user_data fk_company_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sendbird_user_data
    ADD CONSTRAINT fk_company_user FOREIGN KEY (user_id) REFERENCES public.company(id) ON DELETE CASCADE;


--
-- Name: tasks fk_intern; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_intern FOREIGN KEY (intern_id) REFERENCES public.intern(id) ON DELETE CASCADE;


--
-- Name: sendbird_user_data fk_intern_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sendbird_user_data
    ADD CONSTRAINT fk_intern_user FOREIGN KEY (user_id) REFERENCES public.intern(id) ON DELETE CASCADE;


--
-- Name: posts posts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON DELETE CASCADE;


--
-- Name: posts posts_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.school(id) ON DELETE CASCADE;


--
-- Name: uploaded_files uploaded_files_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id) ON DELETE CASCADE;


--
-- Name: uploaded_files uploaded_files_intern_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uploaded_files
    ADD CONSTRAINT uploaded_files_intern_id_fkey FOREIGN KEY (intern_id) REFERENCES public.intern(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

